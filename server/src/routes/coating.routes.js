const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const coatings = await prisma.coatingType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json(coatings);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Coating name required.' });
  const coating = await prisma.coatingType.create({ data: { name } });
  res.status(201).json(coating);
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const coating = await prisma.coatingType.update({ where: { id: req.params.id }, data: req.body });
  res.json(coating);
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await prisma.coatingType.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Coating type deleted.' });
}));

module.exports = router;
