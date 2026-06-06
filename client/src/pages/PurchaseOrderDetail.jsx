import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function dateOnly(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function inputDate(date) {
  return date.toISOString().slice(0, 10);
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPurchaseOrder() {
      try {
        const response = await fetch(`/api/purchase-orders/${id}`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load purchase order');
        }

        setPo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPurchaseOrder();
  }, [id]);

  async function generateInvoice() {
    setSaving(true);
    setError('');

    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 30);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          po_id: po.id,
          invoice_date: inputDate(today),
          due_date: inputDate(due)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not create invoice');
      }

      navigate(`/invoices/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (!po) {
    return <Alert variant="danger">{error || 'Purchase order not found'}</Alert>;
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
        <div>
          <h4 className="mb-1">{po.po_number}</h4>
          <div className="text-muted-small">Created on {dateOnly(po.created_at)}</div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Badge bg="warning">{po.status}</Badge>
          <Button variant="primary" onClick={generateInvoice} disabled={saving}>
            {saving ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col md={6}>
          <Card className="stat-card h-100">
            <Card.Body>
              <h6>Bill To</h6>
              <div className="fw-semibold">{po.bill_to?.name}</div>
              <div className="text-muted-small">{po.bill_to?.address}</div>
              <div className="text-muted-small">GSTIN: {po.bill_to?.gstin || '-'}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="stat-card h-100">
            <Card.Body>
              <h6>Vendor</h6>
              <div className="fw-semibold">{po.vendor?.name || '-'}</div>
              <div className="text-muted-small">{po.vendor?.address || '-'}</div>
              <div className="text-muted-small">GSTIN: {po.vendor?.gstin || '-'}</div>
              <div className="text-muted-small">{po.vendor?.email || '-'}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="stat-card shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Line Items</h6>
              <div className="text-muted-small">{po.rfq_title || 'RFQ not linked'}</div>
            </div>
            <div className="text-end">
              <div className="text-muted-small">Subtotal</div>
              <strong>{money(po.subtotal)}</strong>
            </div>
          </div>

          <Table responsive className="mb-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{Number(item.quantity).toFixed(2)}</td>
                  <td>{money(item.unit_price)}</td>
                  <td>{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}
