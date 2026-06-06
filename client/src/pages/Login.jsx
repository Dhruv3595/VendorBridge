import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { dashboardPathForRole } from '../sidebarItems.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  // Demo login shortcuts
  const demoAccounts = [
    { role: 'Admin', email: 'admin@vendorbridge.com', pass: 'admin123' },
    { role: 'Officer', email: 'officer@vendorbridge.com', pass: 'officer123' },
    { role: 'Vendor', email: 'vendor@vendorbridge.com', pass: 'vendor123' },
    { role: 'Manager', email: 'manager@vendorbridge.com', pass: 'manager123' },
  ];

  return (
    <div className="vb-auth-page">
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Card */}
        <div className="vb-auth-card">
          {/* Logo */}
          <div className="vb-auth-logo">
            <div className="vb-auth-logo-icon">🔗</div>
            <div className="vb-auth-logo-text">VendorBridge</div>
          </div>
          <div className="vb-auth-sub">Procurement & Vendor Management ERP</div>

          <div className="vb-auth-heading" style={{ marginBottom: 20 }}>Welcome back</div>

          {error && (
            <div className="vb-alert vb-alert-danger" style={{ marginBottom: 16 }}>
              <Lock size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="vb-form-group">
              <label className="vb-form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  className="vb-input"
                  style={{ paddingLeft: 36 }}
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="vb-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="vb-form-label" style={{ margin: 0 }}>Password</label>
                <a href="#" style={{ fontSize: 12.5, color: 'var(--primary)' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  className="vb-input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 2
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="vb-btn vb-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 16 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="vb-spin" style={{ width: 16, height: 16 }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create account</Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="vb-card" style={{ marginTop: 16, padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>
            Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {demoAccounts.map(acc => (
              <button
                key={acc.role}
                className="vb-btn vb-btn-outline vb-btn-sm"
                style={{ justifyContent: 'center', fontSize: 12 }}
                onClick={() => setForm({ email: acc.email, password: acc.pass })}
              >
                {acc.role}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            Click a role to fill credentials, then sign in
          </div>
        </div>
      </div>
    </div>
  );
}
