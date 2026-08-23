require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const saleRoutes = require('./routes/sale.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes');
const coatingRoutes = require('./routes/coating.routes');
const adjustmentRoutes = require('./routes/adjustment.routes');
const auditRoutes      = require('./routes/audit.routes');
const attendanceRoutes = require('./routes/attendance.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// CORS — allow both local dev and Vercel frontend
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  /\.vercel\.app$/,
  /ashirwad/i,
];

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser / curl
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    cb(allowed ? null : new Error('CORS not allowed'), allowed);
  },
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (local dev fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/coatings', coatingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/attendance', attendanceRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use(errorHandler);

module.exports = app;
