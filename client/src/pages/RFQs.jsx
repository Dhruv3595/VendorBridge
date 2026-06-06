import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function badgeVariant(status) {
  if (['Published', 'Quotation Received', 'Approved', 'PO Generated'].includes(status)) return 'success';
  if (['Closed', 'Rejected', 'Expired'].includes(status)) return 'secondary';
  if (status === 'Approval Pending') return 'primary';
  return 'warning';
}

export default function RFQs() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRfqs() {
      try {
        const response = await fetch('/api/rfqs', {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load RFQs');
        }

        setRfqs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRfqs();
  }, []);

  async function publishRfq(rfqId) {
    setError('');

    try {
      const response = await fetch(`/api/rfqs/${rfqId}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not publish RFQ');
      }

      setRfqs((current) => current.map((rfq) => (rfq.id === rfqId ? data : rfq)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">RFQs</h5>
        {user?.role === 'Officer' && (
          <Button as={Link} to="/rfqs/new" variant="primary">+ New RFQ</Button>
        )}
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
                  <th>RFQ Title</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Assigned Vendors</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-muted-small">No RFQs found.</td>
                  </tr>
                )}
                {rfqs.map((rfq) => (
                  <tr key={rfq.id}>
                    <td>{rfq.title}</td>
                    <td>{rfq.category || '-'}</td>
                    <td>{rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : '-'}</td>
                    <td>{rfq.assigned_vendor_count}</td>
                    <td>
                      <Badge bg={badgeVariant(rfq.status)}>{rfq.status}</Badge>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {user?.role === 'Officer' && rfq.status === 'Draft' && (
                          <Button size="sm" variant="outline-primary" onClick={() => publishRfq(rfq.id)}>
                            Publish
                          </Button>
                        )}
                        {['Admin', 'Officer'].includes(user?.role) && (
                          <Button
                            size="sm"
                            as={Link}
                            to={`/rfqs/${rfq.id}/quotations/compare`}
                            variant="outline-secondary"
                          >
                            Compare
                          </Button>
                        )}
                        {user?.role === 'Vendor' && ['Published', 'Quotation Received'].includes(rfq.status) && (
                          <Button
                            size="sm"
                            as={Link}
                            to={`/rfqs/${rfq.id}/quotations/submit`}
                            variant="outline-primary"
                          >
                            Submit Quote
                          </Button>
                        )}
                      </div>
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
