import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/vendors', label: 'Vendors' },
  { path: '/rfqs', label: 'RFQs' },
  { path: '/quotations', label: 'Quotations' },
  { path: '/approvals', label: 'Approvals' },
  { path: '/purchase-orders', label: 'Purchase Orders' },
  { path: '/invoices', label: 'Invoices' },
  { path: '/reports', label: 'Reports' },
  { path: '/activity', label: 'Activity' }
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar d-flex flex-column">
      <h4 className="mb-4">VendorBridge</h4>
      <Nav className="flex-column">
        {links.map((link) => (
          <Nav.Link key={link.path} as={NavLink} to={link.path}>
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
