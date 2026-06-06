import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext.jsx';

// The four steps in the approval workflow
const STEPS = ['Submitted', 'L1 Review', 'L2 Approval', 'Generate PO'];

// Which step index maps to which approval level / status
function currentStep(approval) {
  if (!approval) return 0;
  if (approval.status === 'Rejected') return 1; // stuck at L1
  if (approval.status === 'Approved') return 3;  // PO done
  return approval.level; // level 1 = step 1, level 2 = step 2
}

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [acting, setActing] = useState(false);

  async function loadApproval() {
    try {
      const res = await fetch(`/api/approvals/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Approval not found');
      setApproval(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApproval();
  }, [id]);

  async function handleAction(action) {
    setActing(true);
    setError('');
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ remarks })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Could not ${action}`);

      // Reload to reflect new status
      await loadApproval();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!approval) {
    return <Alert variant="danger">{error || 'Approval not found'}</Alert>;
  }

  const step = currentStep(approval);

  // Show action buttons only if the logged-in user is the approver and it's still pending
  const canAct = user?.id === approval.approver_id && approval.status === 'Pending';

  return (
    <div>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {/* Progress stepper */}
      <div className="d-flex align-items-center mb-4 gap-0">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={label} className="d-flex align-items-center flex-grow-1">
              <div
                style={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active
                    ? 'var(--accent)'
                    : done
                      ? 'var(--success)'
                      : 'var(--border)',
                  color: active || done ? '#fff' : 'var(--text-muted)',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className="ms-1 me-1 small"
                style={{
                  color: active ? 'var(--accent)' : done ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: active ? 'bold' : 'normal',
                  whiteSpace: 'nowrap'
                }}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flexGrow: 1,
                    height: 2,
                    background: done ? 'var(--success)' : 'var(--border)',
                    margin: '0 4px'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="row">
        {/* Left — approval chain */}
        <div className="col-md-6 mb-3">
          <Card style={{ borderColor: 'var(--border)' }}>
            <Card.Body>
              <h6 className="mb-3">Approval Chain</h6>
              <div className="d-flex align-items-center justify-content-between p-2 rounded mb-2"
                style={{ background: 'var(--primary-light)' }}>
                <div>
                  <span className="fw-semibold">{approval.approver_name || 'Unassigned'}</span>
                  <span className="text-muted-small ms-2">— Level {approval.level}</span>
                </div>
                <div className="text-end">
                  <Badge bg={
                    approval.status === 'Approved'
                      ? 'success'
                      : approval.status === 'Rejected'
                        ? 'danger'
                        : 'warning'
                  }>
                    {approval.status === 'Pending' ? 'Awaiting' : approval.status}
                  </Badge>
                  {approval.acted_at && (
                    <div className="text-muted-small mt-1" style={{ fontSize: '0.75rem' }}>
                      {new Date(approval.acted_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Right — quotation summary */}
        <div className="col-md-6 mb-3">
          <Card style={{ borderColor: 'var(--accent)', background: 'var(--accent-light)' }}>
            <Card.Body>
              <h6 className="mb-3">Quotation Summary</h6>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted-small">Vendor</span>
                <strong>{approval.vendor_name}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted-small">RFQ</span>
                <strong>{approval.rfq_title}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted-small">Subtotal</span>
                <strong>₹{parseFloat(approval.subtotal).toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted-small">GST ({approval.tax_percent}%)</span>
                <strong>₹{parseFloat(approval.tax_amount).toFixed(2)}</strong>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Grand Total</span>
                <span className="fw-bold" style={{ color: 'var(--accent-dark)' }}>
                  ₹{parseFloat(approval.grand_total).toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <span className="text-muted-small">Max Delivery</span>
                <strong>{approval.max_delivery_days ?? '—'} days</strong>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <span className="text-muted-small">Rating</span>
                <strong>⭐ 4 / 5</strong>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Remarks + action buttons — only visible to the assigned approver when pending */}
      {canAct ? (
        <Card style={{ borderColor: 'var(--border)' }}>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks before approving or rejecting…"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                variant="success"
                disabled={acting}
                onClick={() => handleAction('approve')}
              >
                {acting ? <Spinner size="sm" animation="border" /> : 'Approve'}
              </Button>
              <Button
                variant="danger"
                disabled={acting}
                onClick={() => handleAction('reject')}
              >
                {acting ? <Spinner size="sm" animation="border" /> : 'Reject'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        approval.remarks && (
          <Card style={{ borderColor: 'var(--border)' }}>
            <Card.Body>
              <h6>Remarks</h6>
              <p className="mb-0 text-muted-small">{approval.remarks}</p>
            </Card.Body>
          </Card>
        )
      )}

      <Button
        variant="link"
        className="mt-3 p-0 text-muted-small"
        onClick={() => navigate('/approvals')}
      >
        ← Back to Approvals
      </Button>
    </div>
  );
}
