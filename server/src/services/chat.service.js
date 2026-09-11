const prisma = require('../config/prisma');
const { OpenAI } = require('openai');

class ChatService {
  constructor() {
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * Main query processor
   * @param {string} userMessage
   * @param {object} context - { user: { id, name, role }, history: [] }
   */
  async processMessage(userMessage, context = {}) {
    const rawQuery = (userMessage || '').trim();
    if (!rawQuery) {
      return {
        reply: 'Please type a question or search for products, stock levels, sales, or suppliers.',
        cards: [],
        suggestions: this.getDefaultSuggestions(),
      };
    }

    try {
      // 1. Try OpenAI if API Key is available
      if (this.openai) {
        return await this.processWithLLM(rawQuery, context);
      }
    } catch (err) {
      console.warn('LLM processing failed, using fallback NLP engine:', err.message);
    }

    // 2. Fallback to deterministic NLP rule engine
    return await this.processWithFallbackEngine(rawQuery, context);
  }

  // ─────────────────────────────────────────────
  // DATABASE QUERY TOOLS
  // ─────────────────────────────────────────────

  async searchProducts({ query, limit = 6, lowStockOnly = false }) {
    const where = { isActive: true };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { partNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        supplier: { select: { id: true, name: true, phone: true } },
        coatingType: { select: { id: true, name: true } },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    if (lowStockOnly) {
      products = products.filter((p) => p.currentStock <= p.minStock);
    }

    return products;
  }

  async getProductDetails(identifier) {
    if (!identifier) return null;
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { sku: { equals: identifier, mode: 'insensitive' } },
          { partNumber: { equals: identifier, mode: 'insensitive' } },
          { name: { contains: identifier, mode: 'insensitive' } },
          { id: identifier },
        ],
      },
      include: {
        category: true,
        supplier: true,
        coatingType: true,
        inventoryTransactions: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            transactionType: true,
            quantity: true,
            createdAt: true,
            notes: true,
          },
        },
      },
    });
    return product;
  }

  async getLowStockProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true, phone: true } },
      },
    });

    const lowStock = products
      .filter((p) => p.currentStock <= p.minStock)
      .sort((a, b) => {
        // Sort out-of-stock first, then lowest stock ratio
        if (a.currentStock === 0 && b.currentStock !== 0) return -1;
        if (b.currentStock === 0 && a.currentStock !== 0) return 1;
        return a.currentStock - b.currentStock;
      })
      .slice(0, limit);

    return lowStock;
  }

  async getInventorySummary() {
    const [totalProducts, activeProducts, categoriesCount, allProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, price: true, purchasePrice: true, minStock: true },
      }),
    ]);

    let totalStockUnits = 0;
    let totalSellingValue = 0;
    let totalPurchaseValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of allProducts) {
      const stock = Number(p.currentStock) || 0;
      const price = Number(p.price) || 0;
      const purchasePrice = Number(p.purchasePrice) || price;
      totalStockUnits += stock;
      totalSellingValue += stock * price;
      totalPurchaseValue += stock * purchasePrice;
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= p.minStock) {
        lowStockCount++;
      }
    }

    return {
      totalProducts,
      activeProducts,
      categoriesCount,
      totalStockUnits,
      totalSellingValue: Math.round(totalSellingValue),
      totalPurchaseValue: Math.round(totalPurchaseValue),
      lowStockCount,
      outOfStockCount,
    };
  }

  async getSalesSummary(timeframe = 'today') {
    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      include: {
        customer: { select: { name: true, company: true } },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
    const totalOrders = sales.length;

    return {
      timeframe,
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      recentSales: sales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customerName: s.customer?.company || s.customer?.name || 'Walk-in',
        totalAmount: Number(s.totalAmount),
        status: s.status,
        date: s.createdAt,
        itemCount: s.items.length,
      })),
    };
  }

  async getPurchaseOrdersSummary(status) {
    const where = { status: { not: 'CANCELLED' } };
    if (status) {
      where.status = status;
    }

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalAmount = pos.reduce((acc, po) => acc + Number(po.totalAmount || 0), 0);

    return {
      count: pos.length,
      totalAmount: Math.round(totalAmount),
      orders: pos.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplier?.name,
        supplierPhone: po.supplier?.phone,
        status: po.status,
        totalAmount: Number(po.totalAmount),
        itemCount: po.items.length,
        date: po.createdAt,
      })),
    };
  }

  async searchSuppliers(query) {
    const where = { isActive: true };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { contactPerson: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }
    return prisma.supplier.findMany({
      where,
      select: {
        id: true,
        name: true,
        company: true,
        contactPerson: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        gstNumber: true,
        _count: { select: { products: true, purchaseOrders: true } },
      },
      take: 5,
    });
  }

  async searchCustomers(query) {
    const where = { isActive: true };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }
    return prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        company: true,
        phone: true,
        city: true,
        outstandingAmt: true,
        creditLimit: true,
      },
      take: 5,
    });
  }

  // ─────────────────────────────────────────────
  // LLM INTEGRATION (OpenAI Function Calling)
  // ─────────────────────────────────────────────

  async processWithLLM(query, context) {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'getInventorySummary',
          description: 'Get total products count, stock value, low stock count, and general health metrics',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getLowStockProducts',
          description: 'Get list of items that are running low on stock or completely out of stock',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of items to retrieve (default: 8)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'searchProducts',
          description: 'Search products by name, part number, SKU, company/brand, or shelf location',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search term or product keyword' },
              lowStockOnly: { type: 'boolean', description: 'Only show low stock items' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getProductDetails',
          description: 'Get comprehensive details of a specific product by SKU, Part Number, or exact name',
          parameters: {
            type: 'object',
            properties: {
              identifier: { type: 'string', description: 'Product name, SKU, or part number' },
            },
            required: ['identifier'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getSalesSummary',
          description: 'Get sales numbers, revenue, and recent invoices for today, this week, or this month',
          parameters: {
            type: 'object',
            properties: {
              timeframe: { type: 'string', enum: ['today', 'week', 'month'], description: 'Time range' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getPurchaseOrdersSummary',
          description: 'Get purchase orders, supplier shipments, and procurement status',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['PENDING', 'APPROVED', 'RECEIVED', 'DRAFT'] },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'searchSuppliers',
          description: 'Find supplier details, contact numbers, and cities',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string' } },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'searchCustomers',
          description: 'Find customer details, pending balance, and contact numbers',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string' } },
          },
        },
      },
    ];

    const systemPrompt = `You are "Ashirwad AI", the expert inventory assistant for Ashirwad Enterprises IMS.
User Name: ${context.user?.name || 'Staff Member'}
User Role: ${context.user?.role || 'STAFF'}

Core Guidelines:
1. Provide accurate, clear, and professional answers.
2. Support English, Hindi, and Hinglish seamlessly. If the user asks in Hindi/Hinglish (e.g. "Kitna maal bacha hai?"), respond in warm, natural Hinglish or clear Hindi/English.
3. Currency amounts should always be formatted in Indian Rupees (₹).
4. Use formatting (bullet points, bold text) for easy scanning.
5. If items are out of stock or below minimum threshold, highlight the urgency clearly.
6. Always call the appropriate tool when answering questions about inventory, stock, sales, purchases, or suppliers.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.history || []).slice(-4),
      { role: 'user', content: query },
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls;
    let cardData = [];

    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const fnName = toolCall.function.name;
      const fnArgs = JSON.parse(toolCall.function.arguments || '{}');

      let toolResult = null;
      if (fnName === 'getInventorySummary') {
        toolResult = await this.getInventorySummary();
      } else if (fnName === 'getLowStockProducts') {
        toolResult = await this.getLowStockProducts(fnArgs.limit || 8);
        cardData = this.formatProductCards(toolResult);
      } else if (fnName === 'searchProducts') {
        toolResult = await this.searchProducts(fnArgs);
        cardData = this.formatProductCards(toolResult);
      } else if (fnName === 'getProductDetails') {
        toolResult = await this.getProductDetails(fnArgs.identifier);
        if (toolResult) cardData = this.formatProductCards([toolResult]);
      } else if (fnName === 'getSalesSummary') {
        toolResult = await this.getSalesSummary(fnArgs.timeframe || 'today');
      } else if (fnName === 'getPurchaseOrdersSummary') {
        toolResult = await this.getPurchaseOrdersSummary(fnArgs.status);
      } else if (fnName === 'searchSuppliers') {
        toolResult = await this.searchSuppliers(fnArgs.query);
      } else if (fnName === 'searchCustomers') {
        toolResult = await this.searchCustomers(fnArgs.query);
      }

      // Feed tool result back to LLM to produce conversational reply
      const followUpMessages = [
        ...messages,
        choice.message,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          name: fnName,
          content: JSON.stringify(toolResult || {}),
        },
      ];

      const followUpRes = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: followUpMessages,
      });

      return {
        reply: followUpRes.choices[0].message.content,
        cards: cardData,
        toolUsed: fnName,
        suggestions: this.getSuggestionsForTool(fnName),
      };
    }

    return {
      reply: choice.message.content,
      cards: [],
      suggestions: this.getDefaultSuggestions(),
    };
  }

  // ─────────────────────────────────────────────
  // DETERMINISTIC NLP FALLBACK ENGINE
  // ─────────────────────────────────────────────

  async processWithFallbackEngine(query, context) {
    const q = query.toLowerCase().trim();
    let reply = '';
    let cards = [];
    let toolUsed = 'fallback';

    // 1. Low stock / Out of stock queries
    if (
      q.includes('low stock') ||
      q.includes('khatam') ||
      q.includes('out of stock') ||
      q.includes('reorder') ||
      q.includes('kam stock') ||
      q.includes('shortage')
    ) {
      toolUsed = 'getLowStockProducts';
      const items = await this.getLowStockProducts(6);
      cards = this.formatProductCards(items);

      if (items.length === 0) {
        reply = '✅ **Great news!** All active inventory items currently meet or exceed their minimum threshold levels. There are no critical low-stock alerts right now.';
      } else {
        const outCount = items.filter((i) => i.currentStock <= 0).length;
        reply = `⚠️ Found **${items.length} product(s)** that require attention (${outCount} completely out of stock):\n\n` +
          items
            .map(
              (p, idx) =>
                `${idx + 1}. **${p.name}** (SKU: \`${p.sku || p.partNumber || 'N/A'}\`)\n` +
                `   • Current Stock: **${p.currentStock} ${p.unit || 'pcs'}** (Min: ${p.minStock})\n` +
                `   • Shelf Location: \`${p.location || 'Unassigned'}\` | Price: ₹${Number(p.price).toLocaleString('en-IN')}`
            )
            .join('\n\n');
      }
    }

    // 2. Inventory valuation / Overview / Summary
    else if (
      q.includes('summary') ||
      q.includes('valuation') ||
      q.includes('total stock') ||
      q.includes('total inventory') ||
      q.includes('maal kitna hai') ||
      q.includes('overview') ||
      q.includes('kitne product')
    ) {
      toolUsed = 'getInventorySummary';
      const summary = await this.getInventorySummary();
      reply = `📊 **Ashirwad Inventory Summary & Valuation**\n\n` +
        `• **Total Active Products**: ${summary.activeProducts} items across ${summary.categoriesCount} categories\n` +
        `• **Total Stock Units**: ${summary.totalStockUnits.toLocaleString('en-IN')} units\n` +
        `• **Total Inventory Value**: ₹${summary.totalSellingValue.toLocaleString('en-IN')}\n` +
        `• **Estimated Purchase Cost**: ₹${summary.totalPurchaseValue.toLocaleString('en-IN')}\n` +
        `• **Critical Alerts**: 🔴 **${summary.outOfStockCount}** Out of Stock | 🟡 **${summary.lowStockCount}** Low Stock`;
    }

    // 3. Sales / Revenue queries
    else if (
      q.includes('sale') ||
      q.includes('revenue') ||
      q.includes('kamai') ||
      q.includes('bikri') ||
      q.includes('income') ||
      q.includes('challan')
    ) {
      toolUsed = 'getSalesSummary';
      const timeframe = q.includes('month') ? 'month' : q.includes('week') ? 'week' : 'today';
      const salesData = await this.getSalesSummary(timeframe);

      reply = `💰 **Sales Summary (${timeframe.toUpperCase()})**\n\n` +
        `• **Total Revenue**: ₹${salesData.totalRevenue.toLocaleString('en-IN')}\n` +
        `• **Orders / Invoices**: ${salesData.totalOrders}\n\n` +
        (salesData.recentSales.length > 0
          ? `**Recent Invoices:**\n` +
            salesData.recentSales
              .map(
                (s) =>
                  `• Invoice #${s.invoiceNumber || s.id.slice(-6)} - **₹${s.totalAmount.toLocaleString('en-IN')}** (${s.customerName})`
              )
              .join('\n')
          : 'No sales recorded for this timeframe.');
    }

    // 4. Purchase orders / Procurement
    else if (
      q.includes('purchase') ||
      q.includes('po ') ||
      q.includes('supplier order') ||
      q.includes('vendor order') ||
      q.includes('procurement')
    ) {
      toolUsed = 'getPurchaseOrdersSummary';
      const poData = await this.getPurchaseOrdersSummary();
      reply = `📦 **Purchase Orders & Procurement Status**\n\n` +
        `• **Active Orders**: ${poData.count}\n` +
        `• **Total Value**: ₹${poData.totalAmount.toLocaleString('en-IN')}\n\n` +
        (poData.orders.length > 0
          ? `**Recent POs:**\n` +
            poData.orders
              .map(
                (po) =>
                  `• PO #${po.poNumber} (${po.supplierName || 'Vendor'}) - **₹${po.totalAmount.toLocaleString('en-IN')}** [${po.status}]`
              )
              .join('\n')
          : 'No active purchase orders found.');
    }

    // 5. Suppliers search
    else if (q.includes('supplier') || q.includes('vendor') || q.includes('dealer')) {
      toolUsed = 'searchSuppliers';
      const cleanTerm = q.replace(/supplier|vendor|dealer|find|show|search|list/g, '').trim();
      const suppliers = await this.searchSuppliers(cleanTerm);

      if (suppliers.length === 0) {
        reply = '🔍 No matching suppliers found. Try searching by company name, contact person, or city.';
      } else {
        reply = `🏢 **Suppliers Directory (${suppliers.length} found):**\n\n` +
          suppliers
            .map(
              (s) =>
                `• **${s.name}** ${s.company ? `(${s.company})` : ''}\n` +
                `   📞 Phone: ${s.phone || 'N/A'} | 📍 City: ${s.city || 'N/A'}\n` +
                `   📦 Products Supplied: ${s._count.products}`
            )
            .join('\n\n');
      }
    }

    // 6. Customers search
    else if (q.includes('customer') || q.includes('client') || q.includes('buyer') || q.includes('party')) {
      toolUsed = 'searchCustomers';
      const cleanTerm = q.replace(/customer|client|buyer|party|find|show|search|list/g, '').trim();
      const customers = await this.searchCustomers(cleanTerm);

      if (customers.length === 0) {
        reply = '🔍 No matching customers found. Try searching by customer name, phone, or company.';
      } else {
        reply = `👥 **Customer Directory (${customers.length} found):**\n\n` +
          customers
            .map(
              (c) =>
                `• **${c.name}** ${c.company ? `(${c.company})` : ''}\n` +
                `   📞 Phone: ${c.phone || 'N/A'} | Outstanding: ₹${Number(c.outstandingAmt || 0).toLocaleString('en-IN')}`
            )
            .join('\n\n');
      }
    }

    // 7. General Product Search by keyword / Part number
    else {
      toolUsed = 'searchProducts';
      const cleanKeyword = q
        .replace(/stock of|price of|how many|kitna bacha hai|kaha hai|location of|rate of|find|search/g, '')
        .trim();

      const items = await this.searchProducts({ query: cleanKeyword || q, limit: 5 });
      cards = this.formatProductCards(items);

      if (items.length === 0) {
        reply = `🔍 I couldn't find any products matching **"${rawQuery}"**.\n\n` +
          `Try searching by **Part Number**, **SKU**, **Category**, or shelf location. You can also ask:\n` +
          `• "Show low stock products"\n` +
          `• "Total inventory value"\n` +
          `• "Today's sales revenue"`;
      } else {
        reply = `📦 Found **${items.length} matching product(s)** for **"${cleanKeyword || q}"**:\n\n` +
          items
            .map(
              (p, idx) =>
                `${idx + 1}. **${p.name}**\n` +
                `   • SKU: \`${p.sku || p.partNumber || 'N/A'}\` | Shelf: \`${p.location || 'N/A'}\`\n` +
                `   • Available Stock: **${p.currentStock} ${p.unit || 'pcs'}** ${p.currentStock <= p.minStock ? '⚠️ (Low)' : '✅'}\n` +
                `   • Selling Price: **₹${Number(p.price).toLocaleString('en-IN')}**`
            )
            .join('\n\n');
      }
    }

    return {
      reply,
      cards,
      toolUsed,
      suggestions: this.getSuggestionsForTool(toolUsed),
    };
  }

  // ─────────────────────────────────────────────
  // HELPERS & SUGGESTIONS
  // ─────────────────────────────────────────────

  formatProductCards(products = []) {
    return products.map((p) => {
      const stock = Number(p.currentStock) || 0;
      const min = Number(p.minStock) || 0;
      let status = 'in_stock';
      if (stock <= 0) status = 'out_of_stock';
      else if (stock <= min) status = 'low_stock';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku || p.partNumber || 'N/A',
        partNumber: p.partNumber,
        category: p.category?.name || 'General',
        price: Number(p.price) || 0,
        purchasePrice: Number(p.purchasePrice) || 0,
        currentStock: stock,
        minStock: min,
        unit: p.unit || 'pcs',
        location: p.location || 'Unassigned',
        status,
        image: p.productImages && p.productImages[0] ? p.productImages[0] : null,
      };
    });
  }

  getDefaultSuggestions() {
    return [
      '🔴 Low stock alerts',
      '📊 Total inventory value',
      '💰 Today\'s sales report',
      '📦 Active purchase orders',
      '🔍 Find product by part #',
      '🏢 List suppliers directory',
    ];
  }

  getSuggestionsForTool(tool) {
    if (tool === 'getLowStockProducts') {
      return ['📦 Create purchase order', '📊 Inventory overview', '🔍 Search specific product'];
    }
    if (tool === 'getSalesSummary') {
      return ['💰 Sales this month', '📊 Inventory valuation', '👥 Customer list'];
    }
    if (tool === 'getInventorySummary') {
      return ['🔴 Which items are low stock?', '💰 Today\'s sales', '🏢 Supplier list'];
    }
    return this.getDefaultSuggestions();
  }
}

module.exports = new ChatService();
