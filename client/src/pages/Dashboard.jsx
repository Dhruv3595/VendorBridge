import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const emptyStats = {
  activeRfqs: 0,
  pendingApprovals: 0,
  posThisMonth: 0,
  overdueInvoices: 0,
  recentPOs: [],
  spendingTrends: []
};

export default function Dashboard() {
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

  const cards = [
    { label: 'Active RFQs', value: stats.activeRfqs },
    { label: 'Pending Approvals', value: stats.pendingApprovals },
    { label: 'POs This Month', value: stats.posThisMonth },
    { label: 'Overdue Invoices', value: stats.overdueInvoices }
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
                      <td colSpan="5" className="text-muted-small">No purchase orders found.</td>
                    </tr>
                  )}
                  {stats.recentPOs.map((po) => (
                    <tr key={po.id}>
                      <td>{po.po_number}</td>
                      <td>{po.rfq_title || '-'}</td>
                      <td>{po.vendor_name || '-'}</td>
                      <td>{po.status}</td>
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
              <div className="d-grid gap-2">
                <Button variant="primary">New RFQ</Button>
                <Button variant="outline-primary">Add Vendor</Button>
                <Button variant="outline-secondary">View Invoices</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="stat-card shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Spending Trends</h5>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stats.spendingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#00A09D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
