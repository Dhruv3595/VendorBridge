import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function badgeVariant(status) {
  if (status === 'Active') return 'success';
  if (status === 'Closed') return 'secondary';
  return 'warning';
}

export default function RFQs() {
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

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">RFQs</h5>
        <Button as={Link} to="/rfqs/new" variant="primary">+ New RFQ</Button>
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
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted-small">No RFQs found.</td>
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
