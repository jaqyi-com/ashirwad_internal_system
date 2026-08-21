import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet, useLocation } from 'react-router-dom';

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
  '/settings': { title: 'Settings', subtitle: 'Configure your system' },
};

export default function Layout() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'Ashirwad IMS', subtitle: '' };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Header title={page.title} subtitle={page.subtitle} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
