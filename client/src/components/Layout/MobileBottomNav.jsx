import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, TrendingUp, ShoppingCart, MoreHorizontal,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home',     end: true },
  { to: '/products',  icon: Package,        label: 'Products' },
  { to: '/sales',     icon: TrendingUp,     label: 'Sales'    },
  { to: '/purchases', icon: ShoppingCart,   label: 'Purchases'},
  { to: '/suppliers', icon: MoreHorizontal, label: 'More'     },
];

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? ' active' : ''}`
          }
        >
          <Icon size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
