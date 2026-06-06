import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { sidebarItemsForRole } from '../sidebarItems.js';
import {
  LayoutDashboard, Users, Building2, ClipboardList, FileText,
  CheckSquare, ShoppingBag, Receipt, BarChart3, Activity,
  Package, Star, Clock, CheckCircle2, XCircle, Workflow,
  LogOut, Bell, ChevronRight
} from 'lucide-react';

const iconMap = {
  'Dashboard': LayoutDashboard,
  'Users': Users,
  'Vendors': Building2,
  'RFQs': ClipboardList,
  'Assigned RFQs': ClipboardList,
  'Quotations': FileText,
  'My Quotations': FileText,
  'Submit Quotations': FileText,
  'Approvals': CheckSquare,
  'Pending Approvals': Clock,
  'Approved Requests': CheckCircle2,
  'Rejected Requests': XCircle,
  'Purchase Orders': ShoppingBag,
  'Invoices': Receipt,
  'Invoice Status': Receipt,
  'Reports': BarChart3,
  'Activity Logs': Activity,
  'Activity': Activity,
  'Workflow Monitor': Workflow,
};

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = sidebarItemsForRole(user?.role);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 199
          }}
        />
      )}

      <aside className={`vb-sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="vb-sidebar-brand">
          <div className="vb-sidebar-logo">
            <div className="vb-sidebar-logo-icon">🔗</div>
            <div>
              <div className="vb-sidebar-logo-text">VendorBridge</div>
              <div className="vb-sidebar-logo-sub">Procurement ERP</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="vb-sidebar-nav">
          {links.map((link, idx) => {
            const Icon = iconMap[link.label] || LayoutDashboard;
            return (
              <NavLink
                key={`${link.path}-${idx}`}
                to={link.path}
                className={({ isActive }) => `vb-nav-link${isActive ? ' active' : ''}`}
                end={link.path.includes('/dashboard') || link.path === link.path}
                onClick={onClose}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="vb-sidebar-footer">
          <div className="vb-user-info">
            <div className="vb-user-avatar">
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vb-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div className="vb-user-role">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="vb-nav-link"
              style={{ padding: '6px', margin: 0, background: 'transparent', border: 'none' }}
              title="Logout"
            >
              <LogOut size={15} style={{ opacity: 0.6 }} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
