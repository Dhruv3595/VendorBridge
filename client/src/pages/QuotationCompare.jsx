import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';

export default function QuotationCompare() {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(null); // quotation id being selected

  useEffect(() => {
    async function loadData() {
      try {
        const [rfqRes, quotRes] = await Promise.all([
          fetch(`/api/rfqs/${rfqId}`, { credentials: 'include' }),
          fetch(`/api/quotations/rfq/${rfqId}`, { credentials: 'include' })
        ]);

        if (!rfqRes.ok) throw new Error('RFQ not found');
        const rfqData = await rfqRes.json();
        const quotData = quotRes.ok ? await quotRes.json() : [];

        setRfq(rfqData);
        setQuotations(quotData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [rfqId]);

  // Find the lowest grand total for highlighting
  const lowestTotal = quotations.length
    ? Math.min(...quotations.map((q) => parseFloat(q.grand_total) || 0))
    : null;

  async function handleSelect(quotationId) {
    setSelecting(quotationId);
    setError('');

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quotation_id: quotationId, level: 1 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not initiate approval');

      navigate('/approvals');
    } catch (err) {
      setError(err.message);
    } finally {
      setSelecting(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-1">{rfq?.title}</h5>
      <p className="text-muted-small mb-4">
        {quotations.length} quotation{quotations.length !== 1 ? 's' : ''} received
      </p>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {quotations.length === 0 ? (
        <Card className="text-center p-5" style={{ borderColor: 'var(--border)' }}>
          <p className="text-muted-small mb-0">No quotations submitted yet for this RFQ.</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table bordered style={{ minWidth: quotations.length * 220 + 160 }}>
            <thead>
              <tr>
                {/* Row label column */}
                <th style={{ background: 'var(--primary-light)', width: 160 }}>Criteria</th>
                {quotations.map((q) => {
                  const isLowest = parseFloat(q.grand_total) === lowestTotal;
                  return (
                    <th
                      key={q.id}
                      className="text-center"
                      style={{
                        background: isLowest ? 'var(--accent-light)' : 'var(--primary-light)',
                        color: isLowest ? 'var(--accent-dark)' : 'inherit',
                        minWidth: 200
                      }}
                    >
                      {q.vendor_name}
                      {isLowest && (
                        <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem' }}>
                          Lowest
                        </Badge>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Grand Total row */}
              <tr>
                <td className="fw-semibold">Grand Total</td>
                {quotations.map((q) => {
                  const isLowest = parseFloat(q.grand_total) === lowestTotal;
                  return (
                    <td
                      key={q.id}
                      className="text-center fw-bold"
                      style={{
                        background: isLowest ? 'var(--accent-light)' : '',
                        color: isLowest ? 'green' : ''
                      }}
                    >
                      ₹{parseFloat(q.grand_total).toFixed(2)}
                    </td>
                  );
                })}
              </tr>

              {/* GST % row */}
              <tr>
                <td className="fw-semibold">GST %</td>
                {quotations.map((q) => (
                  <td
                    key={q.id}
                    className="text-center"
                    style={{ background: parseFloat(q.grand_total) === lowestTotal ? 'var(--accent-light)' : '' }}
                  >
                    {q.tax_percent}%
                  </td>
                ))}
              </tr>

              {/* Delivery Days row */}
              <tr>
                <td className="fw-semibold">Delivery Days</td>
                {quotations.map((q) => (
                  <td
                    key={q.id}
                    className="text-center"
                    style={{ background: parseFloat(q.grand_total) === lowestTotal ? 'var(--accent-light)' : '' }}
                  >
                    {q.max_delivery_days ?? '—'} days
                  </td>
                ))}
              </tr>

              {/* Vendor Rating (static for now) */}
              <tr>
                <td className="fw-semibold">Vendor Rating</td>
                {quotations.map((q) => (
                  <td
                    key={q.id}
                    className="text-center"
                    style={{ background: parseFloat(q.grand_total) === lowestTotal ? 'var(--accent-light)' : '' }}
                  >
                    ⭐ 4 / 5
                  </td>
                ))}
              </tr>

              {/* Payment Terms (from notes) */}
              <tr>
                <td className="fw-semibold">Payment Terms</td>
                {quotations.map((q) => (
                  <td
                    key={q.id}
                    className="text-center"
                    style={{
                      background: parseFloat(q.grand_total) === lowestTotal ? 'var(--accent-light)' : '',
                      fontSize: '0.85rem'
                    }}
                  >
                    {q.notes || 'Net 30'}
                  </td>
                ))}
              </tr>

              {/* Select button row */}
              <tr>
                <td />
                {quotations.map((q) => {
                  const isLowest = parseFloat(q.grand_total) === lowestTotal;
                  return (
                    <td
                      key={q.id}
                      className="text-center"
                      style={{ background: isLowest ? 'var(--accent-light)' : '' }}
                    >
                      <Button
                        size="sm"
                        variant={isLowest ? 'success' : 'outline-primary'}
                        disabled={selecting === q.id}
                        onClick={() => handleSelect(q.id)}
                      >
                        {selecting === q.id
                          ? <Spinner size="sm" animation="border" />
                          : isLowest ? 'Select & Approve' : 'Select'}
                      </Button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
