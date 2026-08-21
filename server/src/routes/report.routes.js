const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Stock movements report
router.get('/stock-movements', authenticate, asyncHandler(async (req, res) => {
  const { from, to, productId } = req.query;
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (productId) where.productId = productId;

  const transactions = await prisma.inventoryTransaction.findMany({
    where,
    include: { product: { select: { name: true, sku: true, unit: true } }, createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transactions);
}));

// Inventory valuation report
router.get('/valuation', authenticate, asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, currentStock: { gt: 0 } },
    include: { category: true, supplier: true },
    orderBy: { currentStock: 'desc' },
  });

  const data = products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category?.name,
    currentStock: p.currentStock,
    purchasePrice: parseFloat(p.purchasePrice),
    sellingPrice: parseFloat(p.price),
    stockValue: p.currentStock * parseFloat(p.purchasePrice),
    potentialRevenue: p.currentStock * parseFloat(p.price),
  }));

  const totalValue = data.reduce((s, d) => s + d.stockValue, 0);
  const totalRevenue = data.reduce((s, d) => s + d.potentialRevenue, 0);

  res.json({ products: data, totalValue, totalRevenue });
}));

// Low stock report
router.get('/low-stock', authenticate, asyncHandler(async (req, res) => {
  const products = await prisma.$queryRaw`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    LEFT JOIN suppliers s ON p."supplierId" = s.id
    WHERE p."isActive" = true AND p."currentStock" <= p."minStock"
    ORDER BY p."currentStock" ASC
  `;
  res.json(products);
}));

// Sales summary report
router.get('/sales', authenticate, asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const where = { status: { not: 'CANCELLED' } };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [sales, totals] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { customer: true, items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.aggregate({ where, _sum: { totalAmount: true, gstAmount: true }, _count: { id: true } }),
  ]);
  res.json({ sales, totals });
}));

// Purchase summary report
router.get('/purchases', authenticate, asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const where = { status: { not: 'CANCELLED' } };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [orders, totals] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchaseOrder.aggregate({ where, _sum: { totalAmount: true }, _count: { id: true } }),
  ]);
  res.json({ orders, totals });
}));

module.exports = router;
