const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const adjustments = await prisma.stockAdjustment.findMany({
    include: { product: { select: { name: true, sku: true } }, adjustedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(adjustments);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { productId, type, quantity, reason, notes } = req.body;
  if (!productId || !type || !quantity || !reason) {
    return res.status(400).json({ error: 'Product, type, quantity and reason are required.' });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const qty = parseInt(quantity);
  const newStock = type === 'INCREASE'
    ? product.currentStock + qty
    : product.currentStock - qty;

  if (newStock < 0) return res.status(400).json({ error: 'Stock cannot go below 0.' });

  const [adjustment] = await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: { productId, type, quantity: qty, reason, notes, adjustedById: req.user.id },
    }),
    prisma.product.update({ where: { id: productId }, data: { currentStock: newStock } }),
    prisma.inventoryTransaction.create({
      data: {
        productId,
        transactionType: type === 'INCREASE' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        quantity: qty,
        previousStock: product.currentStock,
        newStock,
        referenceType: 'ADJUSTMENT',
        notes: reason,
        createdById: req.user.id,
      },
    }),
  ]);

  res.status(201).json(adjustment);
}));

module.exports = router;
