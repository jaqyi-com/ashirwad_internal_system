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
    ];
  }
  const customers = await prisma.customer.findMany({ where, orderBy: { name: 'asc' } });
  res.json(customers);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json(customer);
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
  res.json(customer);
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.customer.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Customer deleted.' });
}));

module.exports = router;
