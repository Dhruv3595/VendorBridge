import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Trophy, Zap, TrendingDown, Info, Check, ArrowRight } from 'lucide-react';

const seedRFQ = {
  _id: 'r1',
  rfq_number: 'RFQ-2024-001',
  title: 'IT Equipment Q2 2024',
  category: 'IT Hardware',
  quotations: [
    {
      _id: 'q1', vendor_name: 'TechCore Ltd', vendor_id: 'v1',
      items: [
        { name: 'Dell Laptop 15"', quantity: 5, unit_price: 55000, total: 275000 },
        { name: 'HP Monitor 24"', quantity: 5, unit_price: 18000, total: 90000 },
        { name: 'Keyboard + Mouse', quantity: 5, unit_price: 2200, total: 11000 },
      ],
      subtotal: 376000, gst_percent: 18, grand_total: 443680,
      delivery_days: 7, payment_terms: 'Net 30', rating: 4.8,
      notes: 'All items come with 2-year warranty. Free delivery included.'
    },
    {
      _id: 'q2', vendor_name: 'Globalmart Traders', vendor_id: 'v6',
      items: [
        { name: 'Dell Laptop 15"', quantity: 5, unit_price: 52000, total: 260000 },
        { name: 'HP Monitor 24"', quantity: 5, unit_price: 17000, total: 85000 },
        { name: 'Keyboard + Mouse', quantity: 5, unit_price: 2000, total: 10000 },
      ],
      subtotal: 355000, gst_percent: 18, grand_total: 418900,
      delivery_days: 12, payment_terms: 'Net 45', rating: 3.1,
      notes: 'Standard delivery. No warranty beyond manufacturer warranty.'
    },
    {
      _id: 'q3', vendor_name: 'DigitalWorld Pvt Ltd', vendor_id: 'v7',
      items: [
        { name: 'Dell Laptop 15"', quantity: 5, unit_price: 57000, total: 285000 },
        { name: 'HP Monitor 24"', quantity: 5, unit_price: 19000, total: 95000 },
        { name: 'Keyboard + Mouse', quantity: 5, unit_price: 2500, total: 12500 },
      ],
      subtotal: 392500, gst_percent: 18, grand_total: 463150,
      delivery_days: 5, payment_terms: 'Net 30', rating: 4.5,
      notes: 'Express delivery. 3-year extended warranty available.'
    },
  ]
};

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>
      <Star size={13} fill="#F59E0B" /> {rating.toFixed(1)}
    </div>
  );
}

export default function QuotationCompare() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/rfqs/${rfqId}/quotations`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data && data.quotations?.length) setRfq(data);
        else setRfq(seedRFQ);
      })
      .catch(() => setRfq(seedRFQ))
      .finally(() => setLoading(false));
  }, [rfqId]);

  const quotations = rfq?.quotations || [];

  // Find lowest price, fastest delivery, best rating
  const minPrice = Math.min(...quotations.map(q => q.grand_total));
  const minDelivery = Math.min(...quotations.map(q => q.delivery_days));
  const maxRating = Math.max(...quotations.map(q => q.rating));

  async function handleSelectAndApprove() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await fetch(`/api/rfqs/${rfqId}/quotations/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quotation_id: selected }),
      });
      navigate('/approvals');
    } catch {
      navigate('/approvals');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading quotations...</div>;

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Quotation Comparison</div>
          <div className="vb-page-subtitle">
            {rfq?.rfq_number} · {rfq?.title} · {quotations.length} quotations received
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', background: '#F0FDF4', padding: '6px 12px', borderRadius: 20, border: '1px solid #BBF7D0' }}>
          <TrendingDown size={13} color="#16A34A" /> Lowest Price
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', background: '#EFF6FF', padding: '6px 12px', borderRadius: 20, border: '1px solid #BFDBFE' }}>
          <Zap size={13} color="#2563EB" /> Fastest Delivery
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', background: '#F5F3FF', padding: '6px 12px', borderRadius: 20, border: '1px solid #DDD6FE' }}>
          <Star size={13} color="#7C3AED" /> Best Rating
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '6px 12px', background: 'var(--bg)', borderRadius: 20 }}>
          <Info size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Green = lowest price. Selecting a vendor starts the approval workflow.
        </div>
      </div>

      {/* Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(quotations.length, 3)}, 1fr)`, gap: 16, marginBottom: 24 }}>
        {quotations.map(q => {
          const isLowest = q.grand_total === minPrice;
          const isFastest = q.delivery_days === minDelivery;
          const isBestRated = q.rating === maxRating;
          const isSelected = selected === q._id;

          return (
            <div
              key={q._id}
              style={{
                background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                border: `2px solid ${isSelected ? 'var(--primary)' : isLowest ? '#BBF7D0' : 'var(--border)'}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '18px 20px',
                background: isLowest ? '#F0FDF4' : isSelected ? 'var(--primary-soft)' : 'var(--bg)',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{q.vendor_name}</div>
                  <StarRating rating={q.rating} />
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {isLowest && (
                    <span className="vb-badge vb-badge-success" style={{ fontSize: 11 }}>
                      <TrendingDown size={10} /> Lowest Price
                    </span>
                  )}
                  {isFastest && (
                    <span className="vb-badge vb-badge-info" style={{ fontSize: 11 }}>
                      <Zap size={10} /> Fastest Delivery
                    </span>
                  )}
                  {isBestRated && (
                    <span className="vb-badge vb-badge-purple" style={{ fontSize: 11 }}>
                      <Trophy size={10} /> Best Rated
                    </span>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Grand Total (incl. GST)</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: isLowest ? 'var(--success)' : 'var(--text-main)' }}>
                  {fmtRupee(q.grand_total)}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Subtotal: {fmtRupee(q.subtotal)} + GST {q.gst_percent}%
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Delivery', value: `${q.delivery_days} days`, icon: '🚚' },
                    { label: 'Payment', value: q.payment_terms, icon: '💳' },
                  ].map(det => (
                    <div key={det.label}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2 }}>{det.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{det.icon} {det.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  Line Items
                </div>
                {q.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{fmtRupee(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {q.notes && (
                <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{q.notes}"
                </div>
              )}

              {/* Select button */}
              <div style={{ padding: '14px 20px' }}>
                <button
                  className={`vb-btn ${isSelected ? 'vb-btn-success' : 'vb-btn-primary-outline'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setSelected(isSelected ? null : q._id)}
                >
                  {isSelected ? (
                    <><Check size={15} /> Selected</>
                  ) : 'Select Vendor'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom action */}
      {selected && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="vb-btn vb-btn-primary"
            style={{ padding: '10px 24px', fontSize: 14 }}
            onClick={handleSelectAndApprove}
            disabled={submitting}
          >
            {submitting ? (
              <><span className="vb-spin" style={{ width: 16, height: 16 }} /> Submitting...</>
            ) : (
              <>Select & Send for Approval <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      )}
    </>
  );
}
