import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function statusVariant(status) {
  if (status === 'Selected') return 'success';
  if (status === 'Not Selected' || status === 'Rejected') return 'secondary';
  if (status === 'Submitted') return 'primary';
  return 'warning';
}

export default function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [sortBy, setSortBy] = useState('price');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuotations() {
      try {
        const response = await fetch('/api/quotations', {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load quotations');
        }

        setQuotations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuotations();
  }, []);

  const sortedQuotations = useMemo(() => {
    return [...quotations].sort((a, b) => {
      if (sortBy === 'delivery') {
        return Number(a.max_delivery_days || 9999) - Number(b.max_delivery_days || 9999);
      }

      if (sortBy === 'status') {
        return String(a.status).localeCompare(String(b.status));
      }

      return Number(a.grand_total || 0) - Number(b.grand_total || 0);
    });
  }, [quotations, sortBy]);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h5 className="mb-0">{user?.role === 'Vendor' ? 'My Quotations' : 'Quotations'}</h5>
        <Form.Select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          style={{ maxWidth: 220 }}
          aria-label="Sort quotations"
        >
          <option value="price">Sort by price</option>
          <option value="delivery">Sort by delivery</option>
          <option value="status">Sort by status</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="stat-card shadow-sm">
        <Card.Body>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>RFQ</th>
                  <th>Vendor</th>
                  <th>Total</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuotations.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-muted-small">No quotations found.</td>
                  </tr>
                )}
                {sortedQuotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td>{quotation.rfq_title}</td>
                    <td>{quotation.vendor_name}</td>
                    <td className="fw-semibold">{money(quotation.grand_total)}</td>
                    <td>{quotation.max_delivery_days ?? '-'} days</td>
                    <td>
                      <Badge bg={statusVariant(quotation.status)}>{quotation.status}</Badge>
                    </td>
                    <td>
                      {['Admin', 'Officer'].includes(user?.role) ? (
                        <Button
                          as={Link}
                          to={`/rfqs/${quotation.rfq_id}/quotations/compare`}
                          size="sm"
                          variant="outline-primary"
                        >
                          Compare RFQ
                        </Button>
                      ) : (
                        <Button
                          as={Link}
                          to={`/rfqs/${quotation.rfq_id}/quotations/submit`}
                          size="sm"
                          variant="outline-secondary"
                          disabled={quotation.status !== 'Draft'}
                        >
                          {quotation.status === 'Draft' ? 'Edit Draft' : 'Submitted'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
