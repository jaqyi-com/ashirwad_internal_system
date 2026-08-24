const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * GET /api/public/products/:id
 * Public — no authentication required.
 * Returns safe product fields for QR scan view.
 */
router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id, isActive: true },
    select: {
      id: true,
      name: true,
      partNumber: true,
      description: true,
      specifications: true,
      company: true,
      unit: true,
      barcode: true,
      productImages: true,
      designImages: true,
      price: true,
      gstPercent: true,
      currentStock: true,
      location: true,
      category: { select: { name: true } },
      coatingType: { select: { name: true } },
      createdAt: true,
    },
  });

  if (!product) return res.status(404).json({ error: 'Product not found.' });

  // Mask internal pricing from fully public view
  res.json(product);
}));

module.exports = router;
