const express = require('express');
const multer  = require('multer');
const prisma  = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadToGoogleDrive } = require('../utils/googleDrive');

const router = express.Router();

// Image-only upload middleware (used only on the images sub-route)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
}).fields([
  { name: 'productImages', maxCount: 10 },
  { name: 'designImages',  maxCount: 10 },
]);

const processImages = async (files, subfolderName = null) => {
  if (!files || files.length === 0) return [];
  const results = [];
  for (const f of files) {
    const ext = f.mimetype.split('/')[1] || 'jpg';
    const fileName = `img_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
    const url = await uploadToGoogleDrive(f.buffer, fileName, f.mimetype, subfolderName);
    if (url) {
      results.push(url);
    } else {
      results.push(`data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    }
  }
  return results;
};

const parseIndexArray = (val) => {
  if (!val) return [];
  try {
    const p = typeof val === 'string' ? JSON.parse(val) : val;
    return Array.isArray(p) ? p.filter(x => Number.isInteger(x)) : [];
  } catch { return []; }
};

// ─── GET /api/products ─────────────────────
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
      skip, take: parseInt(limit),
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
}));

// ─── GET /api/products/low-stock ───────────
router.get('/low-stock', authenticate, asyncHandler(async (req, res) => {
  const products = await prisma.$queryRaw`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    LEFT JOIN suppliers s ON p."supplierId" = s.id
    WHERE p."currentStock" <= p."minStock" AND p."isActive" = true
    ORDER BY p."currentStock" ASC LIMIT 50
  `;
  res.json(products);
}));

// ─── GET /api/products/:id ──────────────────
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true, supplier: true, coatingType: true,
      inventoryTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}));

// ─── POST /api/products  (create — JSON body) ─
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const {
    name, partNumber, description, specifications,
    categoryId, company, supplierId, location,
    price, purchasePrice, gstPercent,
    currentStock, unit, coatingTypeId, barcode,
    productImages, designImages,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Product name is required.' });

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
      productImages: Array.isArray(productImages) ? productImages : [],
      designImages:  Array.isArray(designImages)  ? designImages  : [],
      coatingTypeId: coatingTypeId || null,
      barcode:       barcode       || null,
    },
    include: { category: true, supplier: true, coatingType: true },
  });

  if (parseInt(currentStock) > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id, transactionType: 'OPENING_STOCK',
        quantity: parseInt(currentStock), previousStock: 0,
        newStock: parseInt(currentStock),
        notes: 'Opening stock on product creation',
        createdById: req.user.id,
      },
    });
  }

  res.status(201).json(product);
}));

// ─── POST /api/products/:id/images  (upload images — multipart) ─
router.post('/:id/images', authenticate, imageUpload, asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  // Indices to remove from existing arrays
  const removePIdx = parseIndexArray(req.body.removeProductImageIndices);
  const removeDIdx = parseIndexArray(req.body.removeDesignImageIndices);

  const keptProduct = (existing.productImages || []).filter((_, i) => !removePIdx.includes(i));
  const keptDesign  = (existing.designImages  || []).filter((_, i) => !removeDIdx.includes(i));

  const subfolderName = `${existing.partNumber || existing.name}`.replace(/[^a-zA-Z0-9 -]/g, '').trim();

  const newProductUris = await processImages(req.files?.productImages, subfolderName);
  const newDesignUris  = await processImages(req.files?.designImages, subfolderName);

  const productImages = [...keptProduct, ...newProductUris];
  const designImages  = [...keptDesign,  ...newDesignUris];

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { productImages, designImages },
    include: { category: true, supplier: true, coatingType: true },
  });

  res.json(product);
}));

// ─── PUT /api/products/:id  (update metadata — JSON body) ─
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const {
    name, partNumber, description, specifications,
    categoryId, company, supplierId, location,
    price, purchasePrice, gstPercent,
    currentStock,
    unit, coatingTypeId, barcode,
    productImages, designImages,
  } = req.body;

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
      coatingTypeId: coatingTypeId !== undefined ? coatingTypeId || null : existing.coatingTypeId,
      barcode:       barcode       !== undefined ? barcode       : existing.barcode,
      ...(productImages !== undefined && { productImages: Array.isArray(productImages) ? productImages : [] }),
      ...(designImages  !== undefined && { designImages:  Array.isArray(designImages)  ? designImages  : [] }),
      ...(currentStock !== undefined && { currentStock: parseInt(currentStock) }),
    },
    include: { category: true, supplier: true, coatingType: true },
  });

  // Record adjustment transaction if stock changed
  if (currentStock !== undefined && parseInt(currentStock) !== existing.currentStock) {
    const newQty = parseInt(currentStock);
    const diff   = newQty - existing.currentStock;
    await prisma.inventoryTransaction.create({
      data: {
        productId:       req.params.id,
        transactionType: diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        quantity:        Math.abs(diff),
        previousStock:   existing.currentStock,
        newStock:        newQty,
        notes:           'Manual stock edit',
        createdById:     req.user.id,
      },
    });
  }

  res.json(product);
}));

// ─── DELETE /api/products/:id ───────────────
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Product deleted.' });
}));

module.exports = router;
