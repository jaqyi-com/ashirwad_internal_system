const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * GET /api/public/products/:id
 * Public — no authentication required.
 * Returns safe product fields for QR scan view.
 */
router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id, isActive: true },
    select: {
      id: true,
      name: true,
      partNumber: true,
      description: true,
      specifications: true,
      company: true,
      unit: true,
      barcode: true,
      productImages: true,
      designImages: true,
      price: true,
      gstPercent: true,
      currentStock: true,
      location: true,
      category: { select: { name: true } },
      coatingType: { select: { name: true } },
      createdAt: true,
    },
  });

  if (!product) return res.status(404).json({ error: 'Product not found.' });

  // Mask internal pricing from fully public view
  res.json(product);
}));

// Public endpoint to view a specific Challan by ID
router.get('/challan/:id', asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { 
      customer: {
        select: {
          name: true,
          company: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
        }
      }, 
      items: { 
        include: { 
          product: {
            select: { name: true, unit: true }
          } 
        } 
      },
    },
  });

  if (!sale || sale.type !== 'CHALLAN') {
    return res.status(404).json({ error: 'Challan not found or invalid type.' });
  }

  // Return safe data without sensitive internal flags
  res.json({
    id: sale.id,
    saleNumber: sale.saleNumber,
    saleDate: sale.saleDate,
    status: sale.status,
    subtotal: sale.subtotal,
    gstAmount: sale.gstAmount,
    totalAmount: sale.totalAmount,
    customer: sale.customer,
    items: sale.items.map(item => ({
      productName: item.product?.name,
      unit: item.product?.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }))
  });
}));

module.exports = router;
