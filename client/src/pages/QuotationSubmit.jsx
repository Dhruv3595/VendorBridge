import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertCircle, FileText } from 'lucide-react';

const seedRFQ = {
  rfq_number: 'RFQ-2024-001',
  title: 'IT Equipment Q2 2024',
  deadline: '2024-06-15',
  items: [
    { name: 'Dell Laptop 15"', quantity: 5, unit: 'Nos' },
    { name: 'HP Monitor 24"', quantity: 5, unit: 'Nos' },
    { name: 'Keyboard + Mouse', quantity: 5, unit: 'Set' },
  ]
};

export default function QuotationSubmit() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [gstPercent, setGstPercent] = useState(18);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetch(`/api/rfqs/${rfqId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setRfq(data?.rfq_number ? data : seedRFQ))
      .catch(() => setRfq(seedRFQ))
      .finally(() => setLoading(false));
  }, [rfqId]);

  function handlePriceChange(idx, val) {
    setPrices(p => ({ ...p, [idx]: Number(val) }));
  }

  const items = rfq?.items || [];
  const subtotal = items.reduce((sum, item, idx) => sum + (prices[idx] || 0) * item.quantity, 0);
  const gstAmount = (subtotal * gstPercent) / 100;
  const grandTotal = subtotal + gstAmount;

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.some((_, i) => !prices[i])) {
      setError('Please provide a unit price for all items.');
      return;
    }
    
    setSaving(true);
    setError('');

    const payload = {
      rfq_id: rfqId,
      items: items.map((item, i) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: prices[i],
        total: prices[i] * item.quantity
      })),
      subtotal,
      gst_percent: gstPercent,
      grand_total: grandTotal,
      delivery_days: deliveryDays,
      payment_terms: paymentTerms,
      notes,
    };

    try {
      const res = await fetch(`/api/rfqs/${rfqId}/quotations/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit quotation');
      navigate('/quotations');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading RFQ details...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Submit Quotation</div>
          <div className="vb-page-subtitle">For {rfq?.rfq_number} — {rfq?.title}</div>
        </div>
      </div>

      {error && <div className="vb-alert vb-alert-danger">{error}</div>}

      <div className="vb-card vb-card-body vb-mb-4" style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-light)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>Instructions for Vendors</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Please quote your best price per unit. The total amount is calculated automatically. Ensure you include standard applicable GST and realistic delivery timelines. You cannot modify the quotation once submitted unless requested by the buyer.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="vb-card vb-card-body vb-mb-4">
          <div className="vb-section-title">
            <FileText size={16} /> Line Items & Pricing
          </div>
          
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Item Requirement</th>
                  <th>Quantity</th>
                  <th>Unit Price (₹) <span className="required">*</span></th>
                  <th style={{ textAlign: 'right' }}>Line Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = (prices[idx] || 0) * item.quantity;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>
                        <input 
                          type="number" 
                          className="vb-input" 
                          style={{ marginBottom: 0, width: 120 }} 
                          placeholder="0.00" 
                          min="0"
                          value={prices[idx] || ''} 
                          onChange={(e) => handlePriceChange(idx, e.target.value)} 
                          required 
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {lineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#F8FAFC' }}>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Subtotal :</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{subtotal.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Terms */}
          <div className="vb-card vb-card-body">
            <div className="vb-section-title">Terms & Conditions</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="vb-form-group" style={{ marginBottom: 0 }}>
                <label className="vb-form-label">Delivery Time (Days)</label>
                <input type="number" className="vb-input" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} min="1" required />
              </div>
              <div className="vb-form-group" style={{ marginBottom: 0 }}>
                <label className="vb-form-label">Payment Terms</label>
                <select className="vb-select" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                  <option>Net 60</option>
                  <option>Immediate</option>
                </select>
              </div>
            </div>
            
            <div className="vb-form-group">
              <label className="vb-form-label">Additional Notes</label>
              <textarea className="vb-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Warranty details, specific terms..." />
            </div>
          </div>

          {/* Grand Total Calc */}
          <div className="vb-card vb-card-body" style={{ height: 'fit-content' }}>
            <div className="vb-section-title">Final Quotation Value</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-secondary)' }}>GST Applicable (%)</span>
              <select className="vb-select" style={{ width: 80, padding: '4px 8px', height: 30 }} value={gstPercent} onChange={e => setGstPercent(Number(e.target.value))}>
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-secondary)' }}>GST Amount</span>
              <span style={{ fontWeight: 600 }}>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="vb-divider" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>Grand Total</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <button type="submit" className="vb-btn vb-btn-primary" style={{ width: '100%', marginTop: 24, justifyContent: 'center' }} disabled={saving}>
              {saving ? <><span className="vb-spin" style={{ width: 14, height: 14 }} /> Submitting...</> : <><Save size={16} /> Submit Formal Quotation</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
