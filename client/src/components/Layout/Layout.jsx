import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Ashirwad Enterprises Inventory Overview' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/categories': { title: 'Categories', subtitle: 'Organize products by category' },
  '/suppliers': { title: 'Suppliers', subtitle: 'Manage suppliers and vendors' },
  '/customers': { title: 'Customers', subtitle: 'Manage customer accounts' },
  '/purchases': { title: 'Purchase Orders', subtitle: 'Track purchases and goods receiving' },
  '/sales': { title: 'Sales Orders', subtitle: 'Track sales and revenue' },
  '/inventory': { title: 'Stock Movements', subtitle: 'Complete inventory audit trail' },
  '/adjustments': { title: 'Stock Adjustments', subtitle: 'Correct stock discrepancies' },
  '/low-stock': { title: 'Low Stock Alerts', subtitle: 'Products that need restocking' },
  '/reports': { title: 'Reports', subtitle: 'Analytics and business insights' },
  '/users': { title: 'User Management', subtitle: 'Manage team access and roles' },
  '/audit': { title: 'Audit Logs', subtitle: 'System activity and change history' },
  '/complaints': { title: 'Complaints', subtitle: 'Manage customer support tickets' },
  '/settings': { title: 'Settings', subtitle: 'Configure your system' },
  '/attendance': { title: 'Attendance', subtitle: 'Live punch feed for today' },
  '/attendance/report': { title: 'Attendance Report', subtitle: 'Date-range attendance analysis' },
  '/attendance/employees': { title: 'Employees', subtitle: 'Employees registered on biometric device' },
  '/attendance/devices': { title: 'Device Settings', subtitle: 'Manage CP Plus attendance devices' },
};

export default function Layout() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'Ashirwad IMS', subtitle: '' };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout app-layout">
      {/* Mobile hamburger — only visible on mobile, opens full sidebar */}
      <button className="sidebar-mobile-toggle" onClick={() => setSidebarOpen(o => !o)}>
        <Menu size={20} />
      </button>

      {/* Overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'mobile-open' : ''}`} onClick={closeSidebar} />

      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header title={page.title} subtitle={page.subtitle} />
        <div className="page-content">
          <AnimatePresence mode="wait">
            <Outlet key={pathname} />
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation — mobile only */}
      <MobileBottomNav />
    </div>
  );
}


