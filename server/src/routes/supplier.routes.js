const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }
  const suppliers = await prisma.supplier.findMany({
    where,
    include: { _count: { select: { products: true, purchaseOrders: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: req.params.id },
    include: {
      products: { where: { isActive: true }, select: { id: true, name: true, currentStock: true } },
      purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
  res.json(supplier);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.create({ data: req.body });
  res.status(201).json(supplier);
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  // Strip computed / relational fields that Prisma rejects in update data
  const { _count, products, purchaseOrders, id, createdAt, updatedAt, ...data } = req.body;
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data });
  res.json(supplier);
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Supplier deleted.' });
}));

module.exports = router;
