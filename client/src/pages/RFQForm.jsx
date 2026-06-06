import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react';

const categories = ['IT Hardware', 'Furniture', 'Stationery', 'Logistics', 'Services', 'Electronics', 'Raw Materials'];
const units = ['Nos', 'Kg', 'Litre', 'Box', 'Set', 'Pair', 'Metre', 'Piece'];

const STEPS = [
  { label: 'RFQ Details', desc: 'Basic information' },
  { label: 'Line Items', desc: 'Items & quantities' },
  { label: 'Vendor Assignment', desc: 'Assign suppliers' },
];

const seedVendors = [
  { _id: 'v1', name: 'TechCore Ltd' },
  { _id: 'v2', name: 'Infra Supplies Co' },
  { _id: 'v3', name: 'FastLog Services' },
  { _id: 'v4', name: 'QuickPrint Co' },
  { _id: 'v5', name: 'ServTech Solutions' },
];

function Stepper({ currentStep }) {
  return (
    <div className="vb-stepper">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="vb-step">
            <div className="vb-step-indicator">
              <div className={`vb-step-circle ${done ? 'done' : active ? 'active' : ''}`}>
                {done ? <Check size={13} /> : i + 1}
              </div>
              <div className={`vb-step-label ${done ? 'done' : active ? 'active' : ''}`}>
                <div style={{ fontWeight: active ? 600 : 500, fontSize: 13 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{step.desc}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`vb-step-line ${done ? 'done' : active ? 'active' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function emptyItem() {
  return { name: '', quantity: 1, unit: 'Nos', description: '' };
}

export default function RFQForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState(seedVendors);
  const [selectedVendors, setSelectedVendors] = useState([]);

  const [form, setForm] = useState({
    title: '', category: '', deadline: '', description: '',
    items: [emptyItem()],
  });

  useEffect(() => {
    fetch('/api/vendors', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setVendors(data); })
      .catch(() => {});
  }, []);

  function updateField(key, val) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function updateItem(idx, key, val) {
    setForm(p => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [key]: val };
      return { ...p, items };
    });
  }

  function addItem() {
    setForm(p => ({ ...p, items: [...p.items, emptyItem()] }));
  }

  function removeItem(idx) {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  }

  function toggleVendor(id) {
    setSelectedVendors(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  }

  async function handleSave(status) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, status, vendor_ids: selectedVendors }),
      });
      if (!res.ok) throw new Error('Failed to create RFQ');
      navigate('/rfqs');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Create New RFQ</div>
          <div className="vb-page-subtitle">Fill in details and assign vendors for quotation</div>
        </div>
      </div>

      <Stepper currentStep={step} />

      {error && <div className="vb-alert vb-alert-danger">{error}</div>}

      {/* Step 1: Details */}
      {step === 0 && (
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">RFQ Details</div>
          <div className="vb-form-grid">
            <div className="vb-form-group">
              <label className="vb-form-label">RFQ Title <span className="required">*</span></label>
              <input className="vb-input" placeholder="e.g. IT Equipment Q2 2024"
                value={form.title} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="vb-form-group">
              <label className="vb-form-label">Category <span className="required">*</span></label>
              <select className="vb-select" value={form.category} onChange={e => updateField('category', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="vb-form-grid">
            <div className="vb-form-group">
              <label className="vb-form-label">Deadline <span className="required">*</span></label>
              <input className="vb-input" type="date" value={form.deadline}
                onChange={e => updateField('deadline', e.target.value)} />
            </div>
            <div /> {/* spacer */}
          </div>
          <div className="vb-form-group">
            <label className="vb-form-label">Description</label>
            <textarea className="vb-textarea" rows={4} placeholder="Describe the procurement requirement in detail..."
              value={form.description} onChange={e => updateField('description', e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="vb-btn vb-btn-outline" onClick={() => navigate('/rfqs')}>Cancel</button>
            <button className="vb-btn vb-btn-primary" onClick={() => setStep(1)}
              disabled={!form.title || !form.category || !form.deadline}>
              Next: Line Items <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Line Items */}
      {step === 1 && (
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Line Items</div>
          <div className="vb-table-wrap" style={{ marginBottom: 12 }}>
            <table className="vb-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input className="vb-input" style={{ marginBottom: 0 }} placeholder="Item name"
                        value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
                    </td>
                    <td>
                      <input className="vb-input" type="number" min="1" style={{ width: 80 }}
                        value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    </td>
                    <td>
                      <select className="vb-select" style={{ width: 90 }}
                        value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}>
                        {units.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="vb-input" placeholder="Notes..."
                        value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                    </td>
                    <td>
                      {form.items.length > 1 && (
                        <button className="vb-btn vb-btn-ghost vb-btn-xs" onClick={() => removeItem(idx)}
                          style={{ color: 'var(--danger)' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="vb-btn vb-btn-outline vb-btn-sm" onClick={addItem}>
            <Plus size={14} /> Add Line Item
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="vb-btn vb-btn-outline" onClick={() => setStep(0)}>← Back</button>
            <button className="vb-btn vb-btn-primary" onClick={() => setStep(2)}
              disabled={form.items.some(i => !i.name)}>
              Next: Assign Vendors <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Vendor Assignment */}
      {step === 2 && (
        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Assign Vendors</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 16 }}>
            Select vendors to receive this RFQ and submit quotations.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
            {vendors.map(v => {
              const sel = selectedVendors.includes(v._id);
              return (
                <div
                  key={v._id}
                  onClick={() => toggleVendor(v._id)}
                  style={{
                    padding: '12px 16px',
                    border: `1.5px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: sel ? 'var(--primary-light)' : 'var(--surface)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 4,
                    border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                    background: sel ? 'var(--primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0, transition: 'all 0.15s'
                  }}>
                    {sel && <Check size={12} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{v.name}</div>
                    {v.category && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{v.category}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="vb-btn vb-btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="vb-btn vb-btn-outline" onClick={() => handleSave('Draft')} disabled={loading}>
              Save as Draft
            </button>
            <button className="vb-btn vb-btn-primary" onClick={() => handleSave('Published')}
              disabled={loading || selectedVendors.length === 0}>
              {loading ? <><span className="vb-spin" style={{ width: 15, height: 15 }} /> Publishing...</> : '🚀 Publish & Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
