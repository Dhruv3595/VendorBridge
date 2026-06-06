import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Phone, Globe, Building, Hash, ChevronRight, ArrowLeft } from 'lucide-react';

const roles = ['Officer', 'Vendor', 'Manager'];
const countries = ['India', 'USA', 'UK', 'UAE', 'Singapore', 'Germany', 'Australia'];
const categories = ['IT Hardware', 'Furniture', 'Stationery', 'Logistics', 'Services', 'Electronics', 'Raw Materials'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'Officer', country: 'India',
    company: '', gst: '', category: '', contactPerson: '', address: '',
    additionalInfo: ''
  });

  const isVendor = form.role === 'Vendor';

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        country: form.country,
        company: form.company,
        gst: form.gst,
        category: form.category,
        additional_info: form.additionalInfo,
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vb-auth-page" style={{ alignItems: 'flex-start', paddingTop: 32 }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Logo */}
        <div className="vb-auth-logo" style={{ marginBottom: 20 }}>
          <div className="vb-auth-logo-icon">🔗</div>
          <div className="vb-auth-logo-text">VendorBridge</div>
        </div>

        <div className="vb-auth-card" style={{ maxWidth: '100%', padding: 36 }}>
          <div className="vb-auth-heading" style={{ marginBottom: 4 }}>Create Account</div>
          <div className="vb-auth-sub" style={{ textAlign: 'left', marginBottom: 24 }}>
            Join VendorBridge and start managing your procurement workflow
          </div>

          {error && (
            <div className="vb-alert vb-alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic info */}
            <div className="vb-section-title">Personal Information</div>

            <div className="vb-form-grid" style={{ marginBottom: 0 }}>
              <div className="vb-form-group">
                <label className="vb-form-label">First Name <span className="required">*</span></label>
                <input className="vb-input" placeholder="John" value={form.firstName}
                  onChange={e => update('firstName', e.target.value)} required />
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Last Name <span className="required">*</span></label>
                <input className="vb-input" placeholder="Doe" value={form.lastName}
                  onChange={e => update('lastName', e.target.value)} required />
              </div>
            </div>

            <div className="vb-form-grid" style={{ marginBottom: 0 }}>
              <div className="vb-form-group">
                <label className="vb-form-label">Email Address <span className="required">*</span></label>
                <input className="vb-input" type="email" placeholder="john@company.com"
                  value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Phone Number</label>
                <input className="vb-input" type="tel" placeholder="+91 9876543210"
                  value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            </div>

            <div className="vb-form-grid" style={{ marginBottom: 0 }}>
              <div className="vb-form-group">
                <label className="vb-form-label">Password <span className="required">*</span></label>
                <input className="vb-input" type="password" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Country</label>
                <select className="vb-select" value={form.country} onChange={e => update('country', e.target.value)}>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="vb-form-grid" style={{ marginBottom: 0 }}>
              <div className="vb-form-group">
                <label className="vb-form-label">Role <span className="required">*</span></label>
                <select className="vb-select" value={form.role} onChange={e => update('role', e.target.value)}>
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Additional Info</label>
                <input className="vb-input" placeholder="Department, notes..."
                  value={form.additionalInfo} onChange={e => update('additionalInfo', e.target.value)} />
              </div>
            </div>

            {/* Vendor extra fields */}
            {isVendor && (
              <>
                <div className="vb-divider" />
                <div className="vb-section-title">Vendor Information</div>

                <div className="vb-form-grid" style={{ marginBottom: 0 }}>
                  <div className="vb-form-group">
                    <label className="vb-form-label">Company Name</label>
                    <input className="vb-input" placeholder="Acme Corp Ltd."
                      value={form.company} onChange={e => update('company', e.target.value)} />
                  </div>
                  <div className="vb-form-group">
                    <label className="vb-form-label">GST Number</label>
                    <input className="vb-input" placeholder="22AAAAA0000A1Z5"
                      value={form.gst} onChange={e => update('gst', e.target.value)} />
                  </div>
                </div>

                <div className="vb-form-grid" style={{ marginBottom: 0 }}>
                  <div className="vb-form-group">
                    <label className="vb-form-label">Category</label>
                    <select className="vb-select" value={form.category} onChange={e => update('category', e.target.value)}>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="vb-form-group">
                    <label className="vb-form-label">Contact Person</label>
                    <input className="vb-input" placeholder="Contact name"
                      value={form.contactPerson} onChange={e => update('contactPerson', e.target.value)} />
                  </div>
                </div>

                <div className="vb-form-group">
                  <label className="vb-form-label">Address</label>
                  <textarea className="vb-textarea" placeholder="Full business address..." rows={3}
                    value={form.address} onChange={e => update('address', e.target.value)} />
                </div>
              </>
            )}

            <button
              type="submit"
              className="vb-btn vb-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? (
                <><span className="vb-spin" style={{ width: 16, height: 16 }} /> Creating account...</>
              ) : (
                <>Create Account <ChevronRight size={15} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
