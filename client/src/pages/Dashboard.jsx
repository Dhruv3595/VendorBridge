import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';

const emptyStats = {
  activeRfqs: 0,
  pendingApprovals: 0,
  posThisMonth: 0,
  overdueInvoices: 0,
  recentPOs: [],
  spendingTrends: []
};

// Role-specific labels for the 4 stat cards
const roleStatLabels = {
  Admin: ['Active RFQs', 'Pending Approvals', 'POs This Month', 'Overdue Invoices'],
  Officer: ['Active RFQs', 'Pending Approvals', 'POs This Month', 'Overdue Invoices'],
  Vendor: ['Assigned RFQs', 'Selected Quotations', 'Submitted Quotations', 'Pending Invoices'],
  Manager: ['Pending Approvals', 'Pending Approvals', 'Approved This Month', 'Rejected This Month']
};

function statusVariant(status) {
  if (['Generated', 'Sent'].includes(status)) return 'primary';
  if (status === 'Accepted') return 'success';
  if (status === 'Completed') return 'secondary';
  return 'warning';
}

// Role-specific quick actions
function QuickActions({ role }) {
  if (role === 'Officer') {
    return (
      <div className="d-grid gap-2">
        <Button as={Link} to="/rfqs/new" variant="primary">+ New RFQ</Button>
        <Button as={Link} to="/vendors/add" variant="outline-primary">Add Vendor</Button>
        <Button as={Link} to="/invoices" variant="outline-secondary">View Invoices</Button>
      </div>
    );
  }

  if (role === 'Admin') {
    return (
      <div className="d-grid gap-2">
        <Button as={Link} to="/vendors" variant="primary">Manage Vendors</Button>
        <Button as={Link} to="/users" variant="outline-primary">Manage Users</Button>
        <Button as={Link} to="/reports" variant="outline-secondary">View Reports</Button>
      </div>
    );
  }

  if (role === 'Vendor') {
    return (
      <div className="d-grid gap-2">
        <Button as={Link} to="/rfqs" variant="primary">View Assigned RFQs</Button>
        <Button as={Link} to="/quotations" variant="outline-primary">My Quotations</Button>
        <Button as={Link} to="/invoices" variant="outline-secondary">Invoice Status</Button>
      </div>
    );
  }

  if (role === 'Manager') {
    return (
      <div className="d-grid gap-2">
        <Button as={Link} to="/approvals" variant="primary">Review Approvals</Button>
        <Button as={Link} to="/activity" variant="outline-secondary">Activity Log</Button>
      </div>
    );
  }

  return null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/dashboard/stats', {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load dashboard');
        }

        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const labels = roleStatLabels[user?.role] || roleStatLabels.Officer;

  const cards = [
    { label: labels[0], value: stats.activeRfqs },
    { label: labels[1], value: stats.pendingApprovals },
    { label: labels[2], value: stats.posThisMonth },
    { label: labels[3], value: stats.overdueInvoices }
  ];

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        {cards.map((card) => (
          <Col md={3} sm={6} key={card.label}>
            <Card className="stat-card shadow-sm">
              <Card.Body>
                <div className="text-muted-small">{card.label}</div>
                <h3 className="mt-2 mb-0">{card.value}</h3>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="stat-card shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-3">Recent Purchase Orders</h5>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>RFQ</th>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPOs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-muted-small">No purchase orders yet.</td>
                    </tr>
                  )}
                  {stats.recentPOs.map((po) => (
                    <tr
                      key={po.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => window.location.href = `/purchase-orders/${po.id}`}
                    >
                      <td>{po.po_number}</td>
                      <td>{po.rfq_title || '-'}</td>
                      <td>{po.vendor_name || '-'}</td>
                      <td>
                        <Badge bg={statusVariant(po.status)}>{po.status}</Badge>
                      </td>
                      <td>{new Date(po.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="stat-card shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-3">Quick Actions</h5>
              <QuickActions role={user?.role} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="stat-card shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Spending Trends</h5>
          {stats.spendingTrends.length === 0 ? (
            <p className="text-muted-small mb-0">No spending data yet.</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={stats.spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rs. ${Number(value).toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#00A09D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
