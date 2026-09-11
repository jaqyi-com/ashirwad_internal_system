const chatService = require('../services/chat.service');

/**
 * Process a chat query from Web or Mobile client
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const userContext = {
      user: req.user,
      history: Array.isArray(history) ? history : [],
    };

    const response = await chatService.processMessage(message, userContext);
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get initial suggestions and prompt pills
 */
const getSuggestions = async (req, res, next) => {
  try {
    const suggestions = chatService.getDefaultSuggestions();
    res.json({
      success: true,
      data: {
        suggestions,
        starterPrompts: [
          { text: 'Which items are low in stock?', icon: 'alert-triangle' },
          { text: 'What is our total inventory value?', icon: 'pie-chart' },
          { text: 'Show sales summary for today', icon: 'trending-up' },
          { text: 'Pending purchase orders from vendors', icon: 'truck' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quick live stats for chatbot header badge
 */
const getQuickStats = async (req, res, next) => {
  try {
    const summary = await chatService.getInventorySummary();
    const sales = await chatService.getSalesSummary('today');
    res.json({
      success: true,
      data: {
        totalProducts: summary.activeProducts,
        lowStockCount: summary.lowStockCount,
        outOfStockCount: summary.outOfStockCount,
        totalInventoryValue: summary.totalSellingValue,
        todaySales: sales.totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getSuggestions,
  getQuickStats,
};
