# Ashirwad Internal System — Inventory Management System

A full-stack **Inventory Management System** built for **Ashirwad Enterprises** to manage products, stock, suppliers, purchases, sales, and reporting.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM v5 |
| Auth | JWT + Refresh Tokens |
| Images | Local uploads (Cloudinary-ready) |

## Features

- 📦 **Products** — Full catalog with images, GST, coating info, part numbers, shelf location
- 📊 **Dashboard** — KPI cards, charts, recent transactions
- 🏷️ **Categories** — Color-coded category management
- 🚚 **Suppliers** — Full supplier profiles with GST/PAN
- 🛒 **Purchase Orders** — PO → Goods Receive → Auto stock update
- 💰 **Sales** — Create sales → Auto stock deduction
- 📈 **Reports** — Inventory valuation, low stock, sales & purchase summaries
- ⚠️ **Low Stock Alerts** — Products below minimum stock level
- 🔧 **Stock Adjustments** — With reason + full audit trail
- 👥 **User Management** — Role-based access (Admin, Manager, Staff, etc.)
- 🔍 **Audit Logs** — Complete system change history

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Install

```bash
git clone https://github.com/jaqyi-com/ashirwad_internal_system.git
cd ashirwad_internal_system
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ashirwad_ims"
JWT_SECRET="your_super_secret_jwt_key"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Set Up Database

```bash
cd server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to PostgreSQL
npm run db:seed      # Seed default data
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

**Default Login:** `admin@ashirwad.com` / `admin123`

## Project Structure

```
ashirwad_internal_system/
├── client/              # React + Vite frontend
│   └── src/
│       ├── pages/       # All 15 pages
│       ├── components/  # Layout, Sidebar, Header
│       ├── store/       # Zustand state management
│       └── utils/       # API client, helpers
│
└── server/              # Node.js + Express backend
    ├── prisma/
    │   ├── schema.prisma # Database schema
    │   └── seed.js       # Default seed data
    └── src/
        ├── routes/       # 14 API route files
        ├── middleware/   # Auth + Error handling
        └── config/       # Prisma client
```

## License

Private — Ashirwad Enterprises internal use only.
