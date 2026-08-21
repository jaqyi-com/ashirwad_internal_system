const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/inventory/transactions
router.get('/transactions', authenticate, asyncHandler(async (req, res) => {
  const { productId, type, page = 1, limit = 50 } = req.query;
  const where = {};
  if (productId) where.productId = productId;
  if (type) where.transactionType = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);
  res.json({ transactions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
}));

module.exports = router;
