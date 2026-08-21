const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}));

router.put('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { name, role, isActive, password } = req.body;
  const data = { name, role, isActive };
  if (password) data.password = await bcrypt.hash(password, 12);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  res.json(user);
}));

router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'User deactivated.' });
}));

// GET /api/users/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json(req.user);
}));

module.exports = router;
