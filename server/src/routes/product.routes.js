const express = require('express');
const multer = require('multer');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Memory storage — works on Vercel serverless (no local filesystem writes)
// Images are stored as base64 data URIs in the database.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
}).fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'designImage', maxCount: 1 },
]);

// Convert an in-memory multer file to a base64 data URI
const toDataUri = (file) =>
  file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : null;

// GET /api/products
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search, categoryId, supplierId, lowStock, page = 1, limit = 20 } = req.query;

  const where = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { partNumber: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (supplierId) where.supplierId = supplierId;
  if (lowStock === 'true') where.currentStock = { lte: prisma.product.fields.minStock };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, supplier: true, coatingType: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
}));

// GET /api/products/low-stock
router.get('/low-stock', authenticate, asyncHandler(async (req, res) => {
  const products = await prisma.$queryRaw`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    LEFT JOIN suppliers s ON p."supplierId" = s.id
    WHERE p."currentStock" <= p."minStock" AND p."isActive" = true
    ORDER BY p."currentStock" ASC
    LIMIT 50
  `;
  res.json(products);
}));

// GET /api/products/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      supplier: true,
      coatingType: true,
      inventoryTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}));

// POST /api/products
router.post('/', authenticate, upload, asyncHandler(async (req, res) => {
  const {
    name, sku, partNumber, description, specifications,
    categoryId, company, supplierId, location, price, purchasePrice,
    gstPercent, minStock, currentStock, unit, coatingTypeId, barcode,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Product name is required.' });

  const productImage = toDataUri(req.files?.productImage?.[0]);
  const designImage  = toDataUri(req.files?.designImage?.[0]);

  const product = await prisma.product.create({
    data: {
      name,
      sku: sku || null,
      partNumber: partNumber || null,
      description: description || null,
      specifications: specifications || null,
      categoryId: categoryId || null,
      company: company || null,
      supplierId: supplierId || null,
      location: location || null,
      price: parseFloat(price) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      gstPercent: parseFloat(gstPercent) || 18,
      minStock: parseInt(minStock) || 0,
      currentStock: parseInt(currentStock) || 0,
      unit: unit || 'pcs',
      productImage,
      designImage,
      coatingTypeId: coatingTypeId || null,
      barcode: barcode || null,
    },
    include: { category: true, supplier: true, coatingType: true },
  });

  // Record opening stock transaction if currentStock > 0
  if (parseInt(currentStock) > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        transactionType: 'OPENING_STOCK',
        quantity: parseInt(currentStock),
        previousStock: 0,
        newStock: parseInt(currentStock),
        notes: 'Opening stock on product creation',
        createdById: req.user.id,
      },
    });
  }

  res.status(201).json(product);
}));

// PUT /api/products/:id
router.put('/:id', authenticate, upload, asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const {
    name, sku, partNumber, description, specifications,
    categoryId, company, supplierId, location, price, purchasePrice,
    gstPercent, minStock, unit, coatingTypeId, barcode,
  } = req.body;

  const productImage = req.files?.productImage?.[0]
    ? toDataUri(req.files.productImage[0])
    : existing.productImage;
  const designImage = req.files?.designImage?.[0]
    ? toDataUri(req.files.designImage[0])
    : existing.designImage;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name: name || existing.name,
      sku: sku !== undefined ? sku || null : existing.sku,
      partNumber: partNumber !== undefined ? partNumber || null : existing.partNumber,
      description: description !== undefined ? description : existing.description,
      specifications: specifications !== undefined ? specifications : existing.specifications,
      categoryId: categoryId !== undefined ? categoryId || null : existing.categoryId,
      company: company !== undefined ? company : existing.company,
      supplierId: supplierId !== undefined ? supplierId || null : existing.supplierId,
      location: location !== undefined ? location : existing.location,
      price: price !== undefined ? parseFloat(price) : existing.price,
      purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : existing.purchasePrice,
      gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : existing.gstPercent,
      minStock: minStock !== undefined ? parseInt(minStock) : existing.minStock,
      unit: unit || existing.unit,
      productImage,
      designImage,
      coatingTypeId: coatingTypeId !== undefined ? coatingTypeId || null : existing.coatingTypeId,
      barcode: barcode !== undefined ? barcode : existing.barcode,
    },
    include: { category: true, supplier: true, coatingType: true },
  });

  res.json(product);
}));

// DELETE /api/products/:id (soft delete)
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Product deleted.' });
}));

module.exports = router;
