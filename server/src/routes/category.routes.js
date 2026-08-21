const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { children: { where: { isActive: true } }, _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name, description, color, icon, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required.' });
  const category = await prisma.category.create({
    data: { name, description, color, icon, parentId: parentId || null },
  });
  res.status(201).json(category);
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { name, description, color, icon, parentId } = req.body;
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { name, description, color, icon, parentId: parentId || null },
  });
  res.json(category);
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Category deleted.' });
}));

module.exports = router;
