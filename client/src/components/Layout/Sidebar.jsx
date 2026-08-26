import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Truck, ShoppingCart, TrendingUp,
  Users, FileText, BarChart2, Settings, ChevronLeft, ChevronRight,
  Layers, ArrowLeftRight, UserCheck, ClipboardList,
  History, Fingerprint, Wifi, UsersRound, MonitorSmartphone
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { label: 'Products', path: '/products', icon: Package },
      { label: 'Categories', path: '/categories', icon: Tags },
      { label: 'Stock Movements', path: '/inventory', icon: History },
      { label: 'Adjustments', path: '/adjustments', icon: ArrowLeftRight },
    ],
  },
  {
    section: 'Purchasing',
    items: [
      { label: 'Suppliers', path: '/suppliers', icon: Truck },
      { label: 'Purchase Orders', path: '/purchases', icon: ShoppingCart },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Customers', path: '/customers', icon: UserCheck },
      { label: 'Sales Orders', path: '/sales', icon: TrendingUp },
    ],
  },
  {
    section: 'Reports',
    items: [
      { label: 'Reports', path: '/reports', icon: BarChart2 },
    ],
  },
  {
    section: 'Attendance',
    items: [
      { label: 'Live Dashboard', path: '/attendance', icon: Fingerprint },
      { label: 'Report', path: '/attendance/report', icon: FileText },
      { label: 'Employees', path: '/attendance/employees', icon: UsersRound },
      { label: 'Devices', path: '/attendance/devices', icon: MonitorSmartphone },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Users', path: '/users', icon: Users },
      { label: 'Audit Logs', path: '/audit', icon: ClipboardList },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏭</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            Ashirwad<br /><span>Enterprises</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
        {navItems.map((group) => (
          <div key={group.section} className="sidebar-section">
            {!collapsed && (
              <div className="sidebar-section-label">{group.section}</div>
            )}
            {group.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? label : undefined}
                onClick={onClose}
              >
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="sidebar-item"
        style={{ margin: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </div>
  );
}
