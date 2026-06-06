import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [monthlySpend, setMonthlySpend] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        const [statsRes, monthlyRes, vendorsRes] = await Promise.all([
          fetch('/api/reports/stats', { credentials: 'include' }),
          fetch('/api/reports/monthly-spend', { credentials: 'include' }),
          fetch('/api/reports/top-vendors', { credentials: 'include' })
        ]);

        const statsData = await statsRes.json();
        const monthlyData = await monthlyRes.json();
        const vendorsData = await vendorsRes.json();

        if (!statsRes.ok) throw new Error(statsData.message || 'Could not load stats');
        if (!monthlyRes.ok) throw new Error(monthlyData.message || 'Could not load monthly spend');
        if (!vendorsRes.ok) throw new Error(vendorsData.message || 'Could not load top vendors');

        setStats(statsData);
        setMonthlySpend(monthlyData);
        setTopVendors(vendorsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  async function exportCsv() {
    setError('');

    try {
      const response = await fetch('/api/reports/export', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Could not export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'purchase-orders.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <Spinner animation="border" />;
  }

  const cards = [
    { label: 'Total Vendors', value: stats?.total_vendors || 0 },
    { label: 'Total RFQs', value: stats?.total_rfqs || 0 },
    { label: 'Total POs', value: stats?.total_pos || 0 },
    { label: 'Invoice Total', value: money(stats?.total_invoice_amount || 0) }
  ];

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
        <h5 className="mb-0">Reports</h5>
        <Button variant="primary" onClick={exportCsv}>Export CSV</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        {cards.map((card) => (
          <Col md={3} sm={6} key={card.label}>
            <Card className="stat-card shadow-sm h-100">
              <Card.Body>
                <div className="text-muted-small">{card.label}</div>
                <h4 className="mt-2 mb-0">{card.value}</h4>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="stat-card shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">Monthly Spend</h5>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="total" fill="#00A09D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>

      <Card className="stat-card shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Top Vendors</h5>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>PO Count</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {topVendors.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-muted-small">No vendor data found.</td>
                </tr>
              )}
              {topVendors.map((vendor) => (
                <tr key={vendor.id || vendor.vendor_name}>
                  <td>{vendor.vendor_name || '-'}</td>
                  <td>{vendor.po_count}</td>
                  <td>{money(vendor.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}
