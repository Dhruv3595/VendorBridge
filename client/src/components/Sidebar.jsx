import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { sidebarItemsForRole } from '../sidebarItems.js';

export default function Sidebar() {
  const { user } = useAuth();
  const links = sidebarItemsForRole(user?.role);

  return (
    <aside className="sidebar d-flex flex-column">
      <div className="mb-4">
        <h5 className="mb-0" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>VendorBridge</h5>
        <div className="small" style={{ opacity: 0.7, fontSize: '0.75rem' }}>Procurement ERP</div>
      </div>
      <Nav className="flex-column">
        {links.map((link) => (
          <Nav.Link key={link.path} as={NavLink} to={link.path} end={link.path.includes('/dashboard')}>
            <span className="me-2" aria-hidden="true">{link.icon}</span>
            {link.label}
          </Nav.Link>
        ))}
      </Nav>

      <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{user?.name}</div>
        <div className="small" style={{ opacity: 0.7 }}>{user?.role}</div>
      </div>
    </aside>
  );
}
