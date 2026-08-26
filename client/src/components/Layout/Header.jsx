import { Bell, LogOut, User, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleColors = {
    ADMIN: 'badge-purple',
    MANAGER: 'badge-blue',
    WAREHOUSE_STAFF: 'badge-green',
    ACCOUNTANT: 'badge-yellow',
    SALES_STAFF: 'badge-orange',
    STAFF: 'badge-gray',
  };

  return (
    <div className="header">
      <div className="header-left">
        <div className="header-title">{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{subtitle}</div>}
      </div>

      <div className="header-right">
        {/* Theme toggle */}
        <button
          className="btn btn-secondary btn-icon theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="btn btn-secondary btn-icon" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        {/* User menu */}
        <div className="dropdown">
          <button
            className="btn btn-secondary"
            onClick={() => setShowMenu(!showMenu)}
            style={{ gap: '10px' }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }} className="header-user-name">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{user?.role}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowMenu(false)} />
              <div className="dropdown-menu">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{user?.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user?.email}</div>
                  <span className={`badge ${roleColors[user?.role] || 'badge-gray'}`} style={{ marginTop: 6 }}>
                    {user?.role}
                  </span>
                </div>
                <button className="dropdown-item" onClick={() => { setShowMenu(false); navigate('/settings'); }}>
                  <User size={14} /> Profile & Settings
                </button>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

