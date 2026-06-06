import { useState } from 'react';
import { Alert, Badge, Button, Card, Form, Table } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../sidebarItems.js';

const demoAccounts = [
  { role: 'Admin',   email: 'admin@vendorbridge.com',   label: 'Admin' },
  { role: 'Officer', email: 'officer@vendorbridge.com', label: 'Officer' },
  { role: 'Vendor',  email: 'vendor@vendorbridge.com',  label: 'Vendor' },
  { role: 'Manager', email: 'manager@vendorbridge.com', label: 'Manager' }
];

const roleColors = { Admin: 'danger', Officer: 'primary', Vendor: 'success', Manager: 'warning' };

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(dashboardPathForRole(loggedInUser.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('Admin@123');
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="text-center mb-4">
          <h2 style={{ color: 'var(--primary)', fontWeight: 700 }}>VendorBridge</h2>
          <p className="text-muted-small">Procurement & Vendor Management ERP</p>
        </div>

        <Card className="auth-card shadow-sm mb-3">
          <Card.Body className="p-4">
            <h5 className="mb-1">Sign In</h5>
            <p className="text-muted-small mb-4">Access your dashboard</p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <Link to="/signup" className="small">Create account</Link>
              </div>

              <Button type="submit" className="w-100" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Demo quick-login cards */}
        <Card className="auth-card shadow-sm">
          <Card.Body className="p-3">
            <p className="small fw-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              Demo Accounts — click to fill credentials
            </p>
            <div className="d-flex flex-wrap gap-2">
              {demoAccounts.map((acct) => (
                <Button
                  key={acct.role}
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => fillDemo(acct.email)}
                >
                  <Badge bg={roleColors[acct.role]} className="me-1">{acct.label}</Badge>
                  {acct.email}
                </Button>
              ))}
            </div>
            <p className="small text-muted-small mt-2 mb-0">All passwords: <code>Admin@123</code></p>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
