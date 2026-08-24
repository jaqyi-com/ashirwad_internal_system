const express = require('express');
const multer  = require('multer');
const prisma  = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Memory storage — Vercel serverless compatible (no local filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize:  5  * 1024 * 1024,  // 5 MB per image file
    fieldSize: 10 * 1024 * 1024,  // 10 MB for text fields (safety margin)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
}).fields([
  { name: 'productImages', maxCount: 10 },
  { name: 'designImages',  maxCount: 10 },
]);

// Convert multer files to base64 data URI array
const toDataUris = (files) =>
  (files || []).map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);

// Safely parse a JSON integer-index array from a form field string
const parseIndexArray = (val) => {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    return Array.isArray(p) ? p.filter(x => Number.isInteger(x)) : [];
  } catch { return []; }
};

// ─────────────────────────────────────────────
// GET /api/products
// ─────────────────────────────────────────────
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search, categoryId, supplierId, page = 1, limit = 20 } = req.query;

  const where = { isActive: true };
  if (search) {
    where.OR = [
      { name:       { contains: search, mode: 'insensitive' } },
      { partNumber: { contains: search, mode: 'insensitive' } },
      { company:    { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (supplierId) where.supplierId = supplierId;

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

// ─────────────────────────────────────────────
// GET /api/products/low-stock
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/products/:id
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST /api/products  (create)
// ─────────────────────────────────────────────
router.post('/', authenticate, upload, asyncHandler(async (req, res) => {
  const {
    name, partNumber, description, specifications,
    categoryId, company, supplierId, location, price, purchasePrice,
    gstPercent, currentStock, unit, coatingTypeId, barcode,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Product name is required.' });

  // Only newly uploaded files — no existing images on create
  const productImages = toDataUris(req.files?.productImages);
  const designImages  = toDataUris(req.files?.designImages);

  const product = await prisma.product.create({
    data: {
      name:          name.trim(),
      partNumber:    partNumber    || null,
      description:   description   || null,
      specifications: specifications || null,
      categoryId:    categoryId    || null,
      company:       company       || null,
      supplierId:    supplierId    || null,
      location:      location      || null,
      price:         parseFloat(price)         || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      gstPercent:    parseFloat(gstPercent)    || 18,
      minStock:      0,
      currentStock:  parseInt(currentStock)   || 0,
      unit:          unit || 'pcs',
      productImages,
      designImages,
      coatingTypeId: coatingTypeId || null,
      barcode:       barcode       || null,
    },
    include: { category: true, supplier: true, coatingType: true },
  });

  // Record opening stock transaction if stock > 0
  if (parseInt(currentStock) > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId:       product.id,
        transactionType: 'OPENING_STOCK',
        quantity:        parseInt(currentStock),
        previousStock:   0,
        newStock:        parseInt(currentStock),
        notes:           'Opening stock on product creation',
        createdById:     req.user.id,
      },
    });
  }

  res.status(201).json(product);
}));

// ─────────────────────────────────────────────
// PUT /api/products/:id  (update)
// Strategy for images:
//   - Frontend sends removeProductImageIndices / removeDesignImageIndices
//     as JSON arrays of integer indices to delete from the existing array.
//   - Never sends back full base64 image data (avoids Vercel 4.5 MB body limit).
//   - New uploads are appended after the kept images.
// ─────────────────────────────────────────────
router.put('/:id', authenticate, upload, asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const {
    name, partNumber, description, specifications,
    categoryId, company, supplierId, location, price, purchasePrice,
    gstPercent, unit, coatingTypeId, barcode,
    removeProductImageIndices,
    removeDesignImageIndices,
  } = req.body;

  // Filter out removed indices from existing arrays
  const removePIdx = parseIndexArray(removeProductImageIndices);
  const removeDIdx = parseIndexArray(removeDesignImageIndices);

  const keptProductImages = (existing.productImages || []).filter((_, i) => !removePIdx.includes(i));
  const keptDesignImages  = (existing.designImages  || []).filter((_, i) => !removeDIdx.includes(i));

  // Append newly uploaded files
  const productImages = [...keptProductImages, ...toDataUris(req.files?.productImages)];
  const designImages  = [...keptDesignImages,  ...toDataUris(req.files?.designImages)];

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name:          name?.trim()    || existing.name,
      partNumber:    partNumber    !== undefined ? partNumber    || null : existing.partNumber,
      description:   description   !== undefined ? description   : existing.description,
      specifications: specifications !== undefined ? specifications : existing.specifications,
      categoryId:    categoryId    !== undefined ? categoryId    || null : existing.categoryId,
      company:       company       !== undefined ? company       : existing.company,
      supplierId:    supplierId    !== undefined ? supplierId    || null : existing.supplierId,
      location:      location      !== undefined ? location      : existing.location,
      price:         price         !== undefined ? parseFloat(price)         : existing.price,
      purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : existing.purchasePrice,
      gstPercent:    gstPercent    !== undefined ? parseFloat(gstPercent)    : existing.gstPercent,
      unit:          unit          || existing.unit,
      productImages,
      designImages,
      coatingTypeId: coatingTypeId !== undefined ? coatingTypeId || null : existing.coatingTypeId,
      barcode:       barcode       !== undefined ? barcode       : existing.barcode,
    },
    include: { category: true, supplier: true, coatingType: true },
  });

  res.json(product);
}));

// ─────────────────────────────────────────────
// DELETE /api/products/:id  (soft delete)
// ─────────────────────────────────────────────
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Product deleted.' });
}));

module.exports = router;
