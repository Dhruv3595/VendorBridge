import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Building2, UserCircle, Phone, Mail, FileText, ChevronLeft, MapPin } from 'lucide-react';

const categories = ['IT Hardware', 'Office Supplies', 'Furniture', 'Stationery', 'Construction', 'Logistics', 'Services', 'Electronics', 'Raw Materials'];

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '', category: 'IT Hardware', gst_number: '',
    contact_person: '', phone: '', email: '',
    address: '', status: 'Active'
  });

  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/vendors/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!data.name) throw new Error('Vendor not found');
        setForm(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.gst_number || !form.phone || !form.email) {
      setError('Company name, GST, phone and email are required');
      return;
    }
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch(isEdit ? `/api/vendors/${id}` : '/api/vendors', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to save vendor');
      navigate('/vendors');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading vendor...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="vb-page-header">
        <div>
          <button className="vb-btn vb-btn-ghost vb-btn-sm" style={{ marginBottom: 8, marginLeft: -8 }} onClick={() => navigate('/vendors')}>
            <ChevronLeft size={16} /> Back to Vendors
          </button>
          <div className="vb-page-title">{isEdit ? 'Edit Vendor Profile' : 'Register New Vendor'}</div>
          <div className="vb-page-subtitle">{isEdit ? 'Update supplier details and status' : 'Add a new supplier to the procurement network'}</div>
        </div>
      </div>

      <div className="vb-card vb-card-body">
        {error && <div className="vb-alert vb-alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="vb-section-title" style={{ marginTop: 0 }}>
            <Building2 size={16} /> Company Details
          </div>
          <div className="vb-form-grid">
            <div className="vb-form-group">
              <label className="vb-form-label">Company Name <span className="required">*</span></label>
              <input className="vb-input" name="name" value={form.name} onChange={updateField} placeholder="e.g. TechCore Ltd" required />
            </div>
            <div className="vb-form-group">
              <label className="vb-form-label">Category / Industry <span className="required">*</span></label>
              <select className="vb-select" name="category" value={form.category} onChange={updateField}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="vb-form-grid">
            <div className="vb-form-group">
              <label className="vb-form-label">GST Number <span className="required">*</span></label>
              <input className="vb-input" name="gst_number" value={form.gst_number} onChange={updateField} placeholder="15-digit GSTIN" required />
            </div>
            <div className="vb-form-group">
              <label className="vb-form-label">Status</label>
              <select className="vb-select" name="status" value={form.status} onChange={updateField}>
                <option value="Active">Active</option>
                <option value="Pending">Pending Approval</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="vb-divider" />

          <div className="vb-section-title">
            <UserCircle size={16} /> Contact Information
          </div>
          <div className="vb-form-grid">
            <div className="vb-form-group">
              <label className="vb-form-label">Contact Person</label>
              <div className="vb-input-icon">
                <UserCircle size={15} />
                <input className="vb-input" name="contact_person" value={form.contact_person} onChange={updateField} placeholder="Full Name" />
              </div>
            </div>
            <div className="vb-form-group">
              <label className="vb-form-label">Primary Phone <span className="required">*</span></label>
              <div className="vb-input-icon">
                <Phone size={15} />
                <input className="vb-input" name="phone" value={form.phone} onChange={updateField} placeholder="+91..." required />
              </div>
            </div>
          </div>
          <div className="vb-form-group">
            <label className="vb-form-label">Email Address <span className="required">*</span></label>
            <div className="vb-input-icon">
              <Mail size={15} />
              <input className="vb-input" type="email" name="email" value={form.email} onChange={updateField} placeholder="billing@company.com" required />
            </div>
          </div>

          <div className="vb-divider" />

          <div className="vb-section-title">
            <MapPin size={16} /> Location
          </div>
          <div className="vb-form-group">
            <label className="vb-form-label">Registered Office Address</label>
            <textarea className="vb-textarea" rows={3} name="address" value={form.address} onChange={updateField} placeholder="Full postal address..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <button type="button" className="vb-btn vb-btn-outline" onClick={() => navigate('/vendors')} disabled={saving}>
              <X size={15} /> Cancel
            </button>
            <button type="submit" className="vb-btn vb-btn-primary" disabled={saving}>
              {saving ? <><span className="vb-spin" style={{ width: 14, height: 14 }} /> Saving...</> : <><Save size={15} /> Save Vendor</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
