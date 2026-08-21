const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/purchases
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, supplierId, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.purchaseOrder.count({ where }),
  ]);
  res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
}));

// GET /api/purchases/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: { supplier: true, items: { include: { product: { include: { category: true } } } }, createdBy: { select: { name: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Purchase order not found.' });
  res.json(order);
}));

// POST /api/purchases
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { supplierId, items, notes, expectedDate } = req.body;
  if (!supplierId || !items?.length) return res.status(400).json({ error: 'Supplier and items required.' });

  // Generate PO number
  const count = await prisma.purchaseOrder.count();
  const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  let subtotal = 0;
  let gstAmount = 0;
  const itemsData = items.map((item) => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    return { productId: item.productId, orderedQty: item.quantity, unitPrice: item.unitPrice, totalPrice: total };
  });

  // Get avg GST
  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, gstPercent: true } });
  const gstMap = Object.fromEntries(products.map(p => [p.id, parseFloat(p.gstPercent)]));
  items.forEach(item => {
    const gst = (item.quantity * item.unitPrice * (gstMap[item.productId] || 18)) / 100;
    gstAmount += gst;
  });

  const order = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      notes,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      subtotal,
      gstAmount,
      totalAmount: subtotal + gstAmount,
      createdById: req.user.id,
      items: { create: itemsData },
    },
    include: { supplier: true, items: { include: { product: true } } },
  });

  res.status(201).json(order);
}));

// PATCH /api/purchases/:id/status
router.patch('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(order);
}));

// POST /api/purchases/:id/receive — Goods receiving
router.post('/:id/receive', authenticate, asyncHandler(async (req, res) => {
  const { receivedItems } = req.body; // [{ purchaseOrderItemId, productId, receivedQty }]

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Process each received item
  for (const received of receivedItems) {
    if (received.receivedQty <= 0) continue;

    // Update PO item received qty
    await prisma.purchaseOrderItem.update({
      where: { id: received.purchaseOrderItemId },
      data: { receivedQty: { increment: received.receivedQty } },
    });

    // Update product stock
    const product = await prisma.product.findUnique({ where: { id: received.productId } });
    const newStock = product.currentStock + received.receivedQty;

    await prisma.product.update({
      where: { id: received.productId },
      data: { currentStock: newStock },
    });

    // Record inventory transaction
    await prisma.inventoryTransaction.create({
      data: {
        productId: received.productId,
        transactionType: 'PURCHASE',
        quantity: received.receivedQty,
        previousStock: product.currentStock,
        newStock,
        referenceType: 'PURCHASE_ORDER',
        referenceId: order.id,
        createdById: req.user.id,
        notes: `Received via ${order.poNumber}`,
      },
    });
  }

  // Check if fully received
  const updatedOrder = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  const isFullyReceived = updatedOrder.items.every(i => i.receivedQty >= i.orderedQty);
  const isPartiallyReceived = updatedOrder.items.some(i => i.receivedQty > 0);

  await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: {
      status: isFullyReceived ? 'RECEIVED' : isPartiallyReceived ? 'PARTIALLY_RECEIVED' : order.status,
      receivedDate: isFullyReceived ? new Date() : null,
    },
  });

  res.json({ message: 'Goods received successfully.' });
}));

// DELETE /api/purchases/:id (cancel)
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
  res.json({ message: 'Purchase order cancelled.' });
}));

module.exports = router;
