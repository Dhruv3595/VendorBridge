import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Card, Spinner, Table } from 'react-bootstrap';

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function dateOnly(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function statusLabel(status) {
  if (status === 'pending_payment') return 'Pending Payment';
  if (status === 'paid') return 'Paid';
  return status || '-';
}

function statusVariant(status) {
  if (status === 'paid') return 'success';
  return 'warning';
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvoices() {
      try {
        const response = await fetch('/api/invoices', {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load invoices');
        }

        setInvoices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
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
                  <th>Invoice ID</th>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-muted-small">No invoices found.</td>
                  </tr>
                )}
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <td>{invoice.id}</td>
                    <td>{invoice.po_number || '-'}</td>
                    <td>{invoice.vendor_name || '-'}</td>
                    <td>{dateOnly(invoice.invoice_date)}</td>
                    <td>{dateOnly(invoice.due_date)}</td>
                    <td>{money(invoice.grand_total)}</td>
                    <td>
                      <Badge bg={statusVariant(invoice.status)}>{statusLabel(invoice.status)}</Badge>
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
