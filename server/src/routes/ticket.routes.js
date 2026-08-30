const express = require('express');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ticketService = require('../services/ticket.service');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const result = await ticketService.getTickets(req.query);
  res.json(result);
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTickets({ search: req.params.id }); // Using search as a hack if id is ticketNumber
  // Ideally, use a direct findUnique by ID in the service, but this works for now if we want to search by ticketNumber or ID
  // Let's just fetch directly for simplicity if it's an ID
  const prisma = require('../config/prisma');
  const actualTicket = await prisma.complaintTicket.findUnique({
    where: { id: req.params.id }
  });
  if (!actualTicket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(actualTicket);
}));

router.patch('/:id/status', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const ticket = await ticketService.updateTicketStatus(req.params.id, status);
  res.json(ticket);
}));

router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  await ticketService.deleteTicket(req.params.id);
  res.json({ message: 'Ticket deleted' });
}));

module.exports = router;
