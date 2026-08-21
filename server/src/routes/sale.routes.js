const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, customerId, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.sale.count({ where }),
  ]);
  res.json({ sales, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: { include: { product: true } }, createdBy: { select: { name: true } } },
  });
  if (!sale) return res.status(404).json({ error: 'Sale not found.' });
  res.json(sale);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { customerId, items, notes, discount = 0 } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Sale items required.' });

  // Validate stock
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
    if (product.currentStock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}` });
    }
  }

  const count = await prisma.sale.count();
  const saleNumber = `SALE-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  let subtotal = 0;
  let gstAmount = 0;
  const itemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    const unitPrice = item.unitPrice || parseFloat(product.price);
    const gstPct = parseFloat(product.gstPercent);
    const itemTotal = item.quantity * unitPrice;
    const itemGst = (itemTotal * gstPct) / 100;
    subtotal += itemTotal;
    gstAmount += itemGst;
    itemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      gstPercent: gstPct,
      totalPrice: itemTotal + itemGst,
    });
  }

  const sale = await prisma.sale.create({
    data: {
      saleNumber,
      customerId: customerId || null,
      notes,
      discount: parseFloat(discount),
      subtotal,
      gstAmount,
      totalAmount: subtotal + gstAmount - parseFloat(discount),
      status: 'CONFIRMED',
      createdById: req.user.id,
      items: { create: itemsData },
    },
    include: { customer: true, items: { include: { product: true } } },
  });

  // Deduct stock and record transactions
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    const newStock = product.currentStock - item.quantity;
    await prisma.product.update({ where: { id: item.productId }, data: { currentStock: newStock } });
    await prisma.inventoryTransaction.create({
      data: {
        productId: item.productId,
        transactionType: 'SALE',
        quantity: item.quantity,
        previousStock: product.currentStock,
        newStock,
        referenceType: 'SALE',
        referenceId: sale.id,
        createdById: req.user.id,
        notes: `Sold via ${saleNumber}`,
      },
    });
  }

  res.status(201).json(sale);
}));

router.patch('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { status, paidAmount } = req.body;
  const sale = await prisma.sale.update({
    where: { id: req.params.id },
    data: { status, ...(paidAmount !== undefined && { paidAmount: parseFloat(paidAmount) }) },
  });
  res.json(sale);
}));

module.exports = router;
