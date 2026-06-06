import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Form, Spinner, Table } from 'react-bootstrap';

export default function QuotationSubmit() {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [items, setItems] = useState([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRfq() {
      try {
        const res = await fetch(`/api/rfqs/${rfqId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('RFQ not found');
        const data = await res.json();
        setRfq(data);
        // Pre-fill items from RFQ line items
        setItems(
          (data.items || []).map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: '',
            delivery_days: ''
          }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRfq();
  }, [rfqId]);

  // Update a single field in the items table
  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  // Live-calculated totals
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const taxAmount = subtotal * (parseFloat(taxPercent) || 0) / 100;
  const grandTotal = subtotal + taxAmount;

  async function handleSubmit(status) {
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rfq_id: rfqId,
          vendor_id: vendorId || rfq?.vendors?.[0]?.id,
          tax_percent: parseFloat(taxPercent) || 0,
          notes,
          items: items.map((item) => ({
            item_name: item.item_name,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price) || 0,
            delivery_days: parseInt(item.delivery_days) || null
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');

      // If submitting (not just saving as draft), patch status
      if (status === 'Submitted') {
        await fetch(`/api/quotations/${data.id}/submit`, {
          method: 'PATCH',
          credentials: 'include'
        });
      }

      navigate('/quotations');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error && !rfq) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      {/* RFQ summary at top */}
      <Card className="mb-4" style={{ borderColor: 'var(--border)' }}>
        <Card.Body>
          <h5 className="mb-1">{rfq?.title}</h5>
          <span className="text-muted-small me-3">Category: {rfq?.category || '—'}</span>
          <span className="text-muted-small me-3">Deadline: {rfq?.deadline || '—'}</span>
          <span className="text-muted-small">Status: {rfq?.status}</span>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <div className="row">
        {/* Left — items table + fields */}
        <div className="col-lg-8">
          <Card className="mb-3" style={{ borderColor: 'var(--border)' }}>
            <Card.Body>
              <h6 className="mb-3">Line Items</h6>
              <Table bordered hover responsive size="sm">
                <thead style={{ background: 'var(--primary-light)' }}>
                  <tr>
                    <th>Item</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 130 }}>Unit Price (₹)</th>
                    <th style={{ width: 120 }}>Delivery Days</th>
                    <th style={{ width: 130 }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                    return (
                      <tr key={i}>
                        <td>{item.item_name}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(i, 'unit_price', e.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="1"
                            value={item.delivery_days}
                            onChange={(e) => handleItemChange(i, 'delivery_days', e.target.value)}
                            placeholder="Days"
                          />
                        </td>
                        <td className="text-end fw-semibold">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <div className="row mt-3">
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Tax / GST %</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      placeholder="e.g. 18"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-8">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Notes / Payment Terms</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes or payment terms…"
                    />
                  </Form.Group>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Right — live summary */}
        <div className="col-lg-4">
          <Card style={{ borderColor: 'var(--accent)', background: 'var(--accent-light)' }}>
            <Card.Body>
              <h6 className="mb-3">Quotation Summary</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted-small">Subtotal</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted-small">GST ({taxPercent || 0}%)</span>
                <strong>₹{taxAmount.toFixed(2)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Grand Total</span>
                <span className="fw-bold fs-5" style={{ color: 'var(--accent-dark)' }}>
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </Card.Body>
          </Card>

          <div className="mt-3 d-grid gap-2">
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => handleSubmit('Submitted')}
            >
              {saving ? <Spinner size="sm" animation="border" /> : 'Submit Quotation'}
            </Button>
            <Button
              variant="outline-secondary"
              disabled={saving}
              onClick={() => handleSubmit('Draft')}
            >
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
