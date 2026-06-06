import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';

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

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [acting, setActing] = useState(false);

  async function loadInvoice() {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load invoice');
      }

      setInvoice(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function emailInvoice() {
    setActing(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/invoices/${id}/email`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not email invoice');
      }

      setMessage(data.preview_url ? `Email sent. Preview: ${data.preview_url}` : 'Email sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  async function markPaid() {
    setActing(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not mark paid');
      }

      setInvoice(data);
      setMessage('Invoice marked as paid.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (!invoice) {
    return <Alert variant="danger">{error || 'Invoice not found'}</Alert>;
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card className="stat-card shadow-sm invoice-card">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h3 className="mb-1">Invoice #{invoice.id}</h3>
              <div className="text-muted-small">PO Number: {invoice.po_number || '-'}</div>
            </div>
            <div className="text-md-end">
              <Badge bg={statusVariant(invoice.status)} className="mb-2">
                {statusLabel(invoice.status)}
              </Badge>
              <div className="text-muted-small">Invoice Date: {dateOnly(invoice.invoice_date)}</div>
              <div className="text-muted-small">Due Date: {dateOnly(invoice.due_date)}</div>
            </div>
          </div>

          <Row className="g-3 mb-4">
            <Col md={6}>
              <Card className="stat-card h-100">
                <Card.Body>
                  <h6>Bill To</h6>
                  <div className="fw-semibold">{invoice.bill_to?.name}</div>
                  <div className="text-muted-small">{invoice.bill_to?.address}</div>
                  <div className="text-muted-small">GSTIN: {invoice.bill_to?.gstin || '-'}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="stat-card h-100">
                <Card.Body>
                  <h6>Vendor</h6>
                  <div className="fw-semibold">{invoice.vendor?.name || '-'}</div>
                  <div className="text-muted-small">{invoice.vendor?.address || '-'}</div>
                  <div className="text-muted-small">GSTIN: {invoice.vendor?.gstin || '-'}</div>
                  <div className="text-muted-small">{invoice.vendor?.email || '-'}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Table responsive className="mb-4">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{Number(item.quantity).toFixed(2)}</td>
                  <td>{money(item.unit_price)}</td>
                  <td>{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Row className="justify-content-end">
            <Col md={5} lg={4}>
              <Table size="sm" className="mb-0">
                <tbody>
                  <tr>
                    <td>Subtotal</td>
                    <td className="text-end">{money(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td>CGST (9%)</td>
                    <td className="text-end">{money(invoice.cgst)}</td>
                  </tr>
                  <tr>
                    <td>SGST (9%)</td>
                    <td className="text-end">{money(invoice.sgst)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Grand Total</td>
                    <td className="text-end fw-bold">{money(invoice.grand_total)}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex flex-wrap gap-2 mt-3">
        <Button as="a" href={`/api/invoices/${id}/pdf`} target="_blank" rel="noreferrer" variant="primary">
          Download PDF
        </Button>
        <Button variant="outline-secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="outline-primary" onClick={emailInvoice} disabled={acting}>
          Email Invoice
        </Button>
        {invoice.status === 'pending_payment' && (
          <Button variant="success" onClick={markPaid} disabled={acting}>
            Mark as Paid
          </Button>
        )}
      </div>
    </>
  );
}
