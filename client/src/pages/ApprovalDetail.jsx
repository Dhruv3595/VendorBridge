import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Check, X, Clock, CheckCircle, XCircle, User } from 'lucide-react';

const seedApproval = {
  _id: 'a1',
  rfq_number: 'RFQ-2024-003',
  rfq_title: 'Annual Stationery Bundle',
  vendor_name: 'QuickPrint Co',
  total_amount: 52000,
  gst_percent: 5,
  grand_total: 54600,
  delivery_days: 3,
  payment_terms: 'Net 30',
  vendor_rating: 4.2,
  status: 'Pending',
  submitted_by: 'Ravi Kumar',
  submitted_at: '2024-05-10T09:30:00Z',
  timeline: [
    { actor: 'Ravi Kumar', role: 'Procurement Officer', action: 'Submitted for approval', time: '2024-05-10T09:30:00Z', status: 'done' },
    { actor: 'Meera Singh', role: 'Procurement Head', action: 'Reviewed and approved', time: '2024-05-10T14:00:00Z', status: 'done' },
    { actor: 'Arjun Mehta', role: 'Finance Manager', action: 'Awaiting approval', time: null, status: 'pending' },
  ]
};

const stepLabels = ['Submitted', 'L1 Review', 'L2 Approval', 'Generate PO'];

function Stepper({ currentStep }) {
  return (
    <div className="vb-stepper">
      {stepLabels.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="vb-step">
            <div className="vb-step-indicator">
              <div className={`vb-step-circle ${done ? 'done' : active ? 'active' : ''}`}>
                {done ? <Check size={13} /> : i + 1}
              </div>
              <div className={`vb-step-label ${done ? 'done' : active ? 'active' : ''}`}>
                {label}
              </div>
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`vb-step-line ${done ? 'done' : active ? 'active' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/approvals/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setApproval(data?.rfq_number ? data : seedApproval))
      .catch(() => setApproval(seedApproval))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action) {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) throw new Error('Action failed');
      navigate('/approvals');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading...</div>;
  if (!approval) return null;

  const currentStep = approval.status === 'Approved' ? 3 : approval.status === 'Rejected' ? 1 : 1;
  const canAct = user?.role === 'Manager' && approval.status === 'Pending';
  const canAdmin = user?.role === 'Admin';

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Approval Workflow</div>
          <div className="vb-page-subtitle">{approval.rfq_number} · {approval.rfq_title}</div>
        </div>
        <span className={`vb-badge ${approval.status === 'Approved' ? 'vb-badge-success' : approval.status === 'Rejected' ? 'vb-badge-danger' : 'vb-badge-warning'}`} style={{ fontSize: 13 }}>
          {approval.status === 'Pending' ? '⏳ Pending Review' : approval.status}
        </span>
      </div>

      <Stepper currentStep={currentStep} />

      {error && <div className="vb-alert vb-alert-danger">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Timeline */}
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Approval Chain</div>
          <div className="vb-timeline">
            {(approval.timeline || seedApproval.timeline).map((item, i) => (
              <div key={i} className="vb-timeline-item">
                <div className={`vb-timeline-dot ${item.status === 'done' ? 'success' : item.status === 'pending' ? 'warning' : 'info'}`} />
                <div className="vb-timeline-line" />
                <div className="vb-timeline-content">
                  <div className="vb-timeline-title">{item.action}</div>
                  <div className="vb-timeline-desc">
                    <User size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {item.actor} · {item.role}
                  </div>
                  <div className="vb-timeline-meta">
                    {item.status === 'done' ? (
                      <><CheckCircle size={12} color="var(--success)" /> {new Date(item.time).toLocaleString('en-IN')}</>
                    ) : (
                      <><Clock size={12} color="var(--warning)" /> Awaiting action</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quotation summary */}
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Quotation Summary</div>
          {[
            { label: 'Selected Vendor', value: approval.vendor_name },
            { label: 'Grand Total', value: fmtRupee(approval.grand_total || approval.total_amount), bold: true, color: 'var(--primary)' },
            { label: 'Subtotal', value: fmtRupee(approval.total_amount) },
            { label: 'GST', value: `${approval.gst_percent}%` },
            { label: 'Delivery', value: `${approval.delivery_days} days` },
            { label: 'Payment Terms', value: approval.payment_terms },
            { label: 'Vendor Rating', value: `⭐ ${approval.vendor_rating}/5.0` },
            { label: 'Submitted By', value: approval.submitted_by },
            { label: 'Submitted On', value: new Date(approval.submitted_at).toLocaleDateString('en-IN') },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{row.label}</span>
              <span style={{ fontWeight: row.bold ? 700 : 500, fontSize: 13.5, color: row.color || 'var(--text-main)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manager action section */}
      {(canAct || canAdmin) && (
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">
            {canAct ? 'Review & Decision' : 'Admin View — Approval Override'}
          </div>
          <div className="vb-form-group">
            <label className="vb-form-label">Remarks</label>
            <textarea
              className="vb-textarea"
              placeholder={canAct ? "Add your review comments or reason for rejection..." : "Admin override remarks..."}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {canAct && (
              <>
                <button
                  className="vb-btn vb-btn-success"
                  style={{ padding: '9px 24px' }}
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                >
                  <Check size={15} /> Approve
                </button>
                <button
                  className="vb-btn vb-btn-danger"
                  style={{ padding: '9px 24px' }}
                  onClick={() => handleAction('reject')}
                  disabled={submitting}
                >
                  <X size={15} /> Reject
                </button>
              </>
            )}
            {canAdmin && (
              <button className="vb-btn vb-btn-outline" onClick={() => navigate('/approvals')}>
                Back to Approvals
              </button>
            )}
          </div>
        </div>
      )}

      {/* Read-only status for officers/vendors */}
      {!canAct && !canAdmin && (
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Current Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
            {approval.status === 'Approved' ? (
              <CheckCircle size={24} color="var(--success)" />
            ) : approval.status === 'Rejected' ? (
              <XCircle size={24} color="var(--danger)" />
            ) : (
              <Clock size={24} color="var(--warning)" />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{approval.status}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {approval.status === 'Pending' ? 'Awaiting manager review' :
                 approval.status === 'Approved' ? 'Purchase order will be generated' :
                 'Quotation was not selected'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
