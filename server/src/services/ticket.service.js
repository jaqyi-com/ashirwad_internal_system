const prisma = require('../config/prisma');

class TicketService {
  async generateTicketNumber() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Count tickets created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const count = await prisma.complaintTicket.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `AE-${dateStr}-${sequence}`;
  }

  async createTicket(data) {
    const ticketNumber = await this.generateTicketNumber();
    
    const ticket = await prisma.complaintTicket.create({
      data: {
        ...data,
        ticketNumber
      }
    });
    
    return ticket;
  }

  async getTickets(filters = {}) {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { customerWaNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.complaintTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.complaintTicket.count({ where })
    ]);

    return { tickets, total, page: Number(page), limit: Number(limit) };
  }

  async updateTicketStatus(id, status) {
    return prisma.complaintTicket.update({
      where: { id },
      data: { status }
    });
  }

  async deleteTicket(id) {
    return prisma.complaintTicket.delete({
      where: { id }
    });
  }
}

module.exports = new TicketService();
