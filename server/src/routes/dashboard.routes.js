const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalStock,
    lowStockCount,
    outOfStockCount,
    todaySales,
    todayPurchases,
    pendingOrders,
    recentTransactions,
    topProducts,
    inventoryValue,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),

    prisma.product.aggregate({ where: { isActive: true }, _sum: { currentStock: true } }),

    prisma.product.count({
      where: { isActive: true, AND: [{ currentStock: { gt: 0 } }] },
    }),

    prisma.product.count({ where: { isActive: true, currentStock: { lte: 0 } } }),

    prisma.sale.aggregate({
      where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    prisma.purchaseOrder.aggregate({
      where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    prisma.purchaseOrder.count({ where: { status: { in: ['PENDING', 'APPROVED'] } } }),

    prisma.inventoryTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
    }),

    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { currentStock: 'desc' },
      take: 5,
      select: { id: true, name: true, currentStock: true, price: true, category: { select: { name: true } } },
    }),

    prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, purchasePrice: true },
    }),
  ]);

  // Calculate low stock properly (need raw query for comparison)
  const lowStockProducts = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM products
    WHERE "isActive" = true AND "currentStock" <= "minStock" AND "currentStock" > 0
  `;

  const totalInventoryValue = inventoryValue.reduce(
    (sum, p) => sum + p.currentStock * parseFloat(p.purchasePrice),
    0
  );

  // Weekly sales chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weeklyData = await Promise.all(
    last7Days.map(async (day) => {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const [sales, purchases] = await Promise.all([
        prisma.sale.aggregate({ where: { createdAt: { gte: day, lt: next }, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
        prisma.purchaseOrder.aggregate({ where: { createdAt: { gte: day, lt: next }, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      ]);
      return {
        date: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sales: parseFloat(sales._sum.totalAmount || 0),
        purchases: parseFloat(purchases._sum.totalAmount || 0),
      };
    })
  );

  res.json({
    stats: {
      totalProducts,
      totalStock: totalStock._sum.currentStock || 0,
      inventoryValue: totalInventoryValue,
      lowStock: lowStockProducts[0]?.count || 0,
      outOfStock: outOfStockCount,
      pendingOrders,
      todaySales: { amount: parseFloat(todaySales._sum.totalAmount || 0), count: todaySales._count.id },
      todayPurchases: { amount: parseFloat(todayPurchases._sum.totalAmount || 0), count: todayPurchases._count.id },
    },
    recentTransactions,
    topProducts,
    weeklyData,
  });
}));

module.exports = router;
