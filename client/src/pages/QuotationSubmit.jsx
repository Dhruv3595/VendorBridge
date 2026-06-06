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
  const [quotationId, setQuotationId] = useState(null);
  const [quotationStatus, setQuotationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRfqAndDraft() {
      try {
        const [rfqResponse, quotationResponse] = await Promise.all([
          fetch(`/api/rfqs/${rfqId}`, { credentials: 'include' }),
          fetch(`/api/quotations/rfq/${rfqId}`, { credentials: 'include' })
        ]);

        if (!rfqResponse.ok) throw new Error('RFQ not found');

        const rfqData = await rfqResponse.json();
        const existingQuotations = quotationResponse.ok ? await quotationResponse.json() : [];
        const existing = existingQuotations[0];

        setRfq(rfqData);

        if (existing) {
          const detailResponse = await fetch(`/api/quotations/${existing.id}`, { credentials: 'include' });
          const detail = detailResponse.ok ? await detailResponse.json() : existing;
          setQuotationId(detail.id);
          setQuotationStatus(detail.status);
          setTaxPercent(detail.tax_percent || 0);
          setNotes(detail.notes || '');
          setItems(
            (detail.items || []).map((item) => ({
              item_name: item.item_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              delivery_days: item.delivery_days || ''
            }))
          );
        } else {
          setItems(
            (rfqData.items || []).map((item) => ({
              item_name: item.item_name,
              quantity: item.quantity,
              unit_price: '',
              delivery_days: ''
            }))
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRfqAndDraft();
  }, [rfqId]);

  function handleItemChange(index, field, value) {
    setItems((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const taxAmount = subtotal * (parseFloat(taxPercent) || 0) / 100;
  const grandTotal = subtotal + taxAmount;
  const canEdit = !quotationStatus || quotationStatus === 'Draft';

  async function handleSubmit(status) {
    setError('');
    setSaving(true);

    try {
      if (!canEdit) {
        throw new Error('Submitted quotations cannot be edited');
      }

      const payload = {
        rfq_id: rfqId,
        tax_percent: parseFloat(taxPercent) || 0,
        notes,
        items: items.map((item) => ({
          item_name: item.item_name,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price) || 0,
          delivery_days: parseInt(item.delivery_days, 10) || null
        }))
      };

      const response = await fetch(quotationId ? `/api/quotations/${quotationId}` : '/api/quotations', {
        method: quotationId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save quotation');
      }

      if (status === 'Submitted') {
        const submitResponse = await fetch(`/api/quotations/${data.id}/submit`, {
          method: 'PATCH',
          credentials: 'include'
        });
        const submitData = await submitResponse.json();

        if (!submitResponse.ok) {
          throw new Error(submitData.message || 'Draft saved but could not be submitted');
        }
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
      <Card className="mb-4 stat-card">
        <Card.Body>
          <h5 className="mb-1">{rfq?.title}</h5>
          <span className="text-muted-small me-3">Category: {rfq?.category || '-'}</span>
          <span className="text-muted-small me-3">
            Deadline: {rfq?.deadline ? new Date(rfq.deadline).toLocaleDateString() : '-'}
          </span>
          <span className="text-muted-small me-3">RFQ Status: {rfq?.status}</span>
          {quotationStatus && <span className="text-muted-small">Quotation: {quotationStatus}</span>}
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <div className="row">
        <div className="col-lg-8">
          <Card className="mb-3 stat-card">
            <Card.Body>
              <h6 className="mb-3">Line Items</h6>
              <Table bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 130 }}>Unit Price</th>
                    <th style={{ width: 120 }}>Delivery Days</th>
                    <th style={{ width: 130 }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                    return (
                      <tr key={item.item_name}>
                        <td>{item.item_name}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            disabled={!canEdit}
                            onChange={(event) => handleItemChange(index, 'unit_price', event.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="1"
                            value={item.delivery_days}
                            disabled={!canEdit}
                            onChange={(event) => handleItemChange(index, 'delivery_days', event.target.value)}
                            placeholder="Days"
                          />
                        </td>
                        <td className="text-end fw-semibold">Rs. {lineTotal.toFixed(2)}</td>
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
                      disabled={!canEdit}
                      onChange={(event) => setTaxPercent(event.target.value)}
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
                      disabled={!canEdit}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Optional notes or payment terms"
                    />
                  </Form.Group>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-lg-4">
          <Card className="stat-card" style={{ borderColor: 'var(--accent)', background: 'var(--accent-light)' }}>
            <Card.Body>
              <h6 className="mb-3">Quotation Summary</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted-small">Subtotal</span>
                <strong>Rs. {subtotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted-small">GST ({taxPercent || 0}%)</span>
                <strong>Rs. {taxAmount.toFixed(2)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Grand Total</span>
                <span className="fw-bold fs-5" style={{ color: 'var(--accent-dark)' }}>
                  Rs. {grandTotal.toFixed(2)}
                </span>
              </div>
            </Card.Body>
          </Card>

          <div className="mt-3 d-grid gap-2">
            <Button variant="primary" disabled={saving || !canEdit} onClick={() => handleSubmit('Submitted')}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Submit Quotation'}
            </Button>
            <Button variant="outline-secondary" disabled={saving || !canEdit} onClick={() => handleSubmit('Draft')}>
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
