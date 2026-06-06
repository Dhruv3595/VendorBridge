import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, X, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const roleBadgeStyle = {
  Admin:   { background: '#FEF2F2', color: '#991b1b' },
  Officer: { background: '#EFF6FF', color: '#1d4ed8' },
  Vendor:  { background: '#F0FDF4', color: '#16a34a' },
  Manager: { background: '#FFFBEB', color: '#b45309' },
};

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const badgeStyle = roleBadgeStyle[user?.role] || { background: '#F3F4F6', color: '#374151' };

  return (
    <>
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="vb-main">
        {/* Topbar */}
        <header className="vb-topbar">
          <div className="vb-topbar-left">
            {/* Mobile hamburger */}
            <button
              className="vb-topbar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="vb-search-bar">
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="vb-topbar-right">
            {/* Notification bell */}
            <button className="vb-topbar-btn" style={{ position: 'relative' }} title="Notifications">
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: '#DC2626',
                border: '1.5px solid #fff'
              }} />
            </button>

            {/* Role badge */}
            <span
              style={{
                ...badgeStyle,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {user?.role}
            </span>

            {/* Avatar + dropdown */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', padding: '4px 8px',
                borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 13, fontWeight: 500, color: 'var(--text-main)',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg)';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              title={`${user?.name} — ${user?.role}`}
            >
              <div className="vb-user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                {getInitials(user?.name)}
              </div>
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown size={13} color="var(--text-muted)" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="vb-content">
          {children}
        </div>
      </main>
    </>
  );
}
