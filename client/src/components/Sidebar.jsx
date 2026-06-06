import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { sidebarItemsForRole } from '../sidebarItems.js';

export default function Sidebar() {
  const { user } = useAuth();
  const links = sidebarItemsForRole(user?.role);

  return (
    <aside className="sidebar d-flex flex-column">
      <h4 className="mb-4">VendorBridge</h4>
      <Nav className="flex-column">
        {links.map((link) => (
          <Nav.Link key={link.path} as={NavLink} to={link.path} end={link.path.includes('/dashboard')}>
            {link.label}
          </Nav.Link>
        ))}
      </Nav>

      <div className="mt-auto pt-4">
        <div className="fw-semibold">{user?.name}</div>
        <div className="small">{user?.role}</div>
      </div>
    </aside>
  );
}
