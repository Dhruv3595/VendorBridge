import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Card, Spinner, Table } from 'react-bootstrap';

function statusVariant(status) {
  if (status === 'Issued') return 'primary';
  if (status === 'Closed') return 'secondary';
  return 'warning';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPurchaseOrders() {
      try {
        const response = await fetch('/api/purchase-orders', {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load purchase orders');
        }

        setPurchaseOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPurchaseOrders();
  }, []);

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="stat-card shadow-sm">
        <Card.Body>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>RFQ Title</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted-small">No purchase orders found.</td>
                  </tr>
                )}
                {purchaseOrders.map((po) => (
                  <tr
                    key={po.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <td>{po.po_number}</td>
                    <td>{po.vendor_name || '-'}</td>
                    <td>{po.rfq_title || '-'}</td>
                    <td>{formatDate(po.created_at)}</td>
                    <td>
                      <Badge bg={statusVariant(po.status)}>{po.status}</Badge>
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
