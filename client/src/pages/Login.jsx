import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, Eye, EyeOff, ArrowRight, X, KeyRound, CheckCircle } from 'lucide-react';
import { dashboardPathForRole } from '../sidebarItems.js';

// ─── Forgot Password Modal (3 steps) ────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e) {
    e.preventDefault();
    if (!email) { setError('Enter your email address'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = {
    email: 'Forgot Password',
    otp:   'Enter OTP',
    reset: 'Set New Password',
    done:  'Password Reset!',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: '32px 28px',
        width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4,
        }}><X size={18} /></button>

        {/* Step indicator */}
        {step !== 'done' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {['email', 'otp', 'reset'].map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: ['email', 'otp', 'reset'].indexOf(step) >= i ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: step === 'done' ? '#F0FDF4' : 'var(--primary-light)',
          }}>
            {step === 'done'
              ? <CheckCircle size={26} color="#16A34A" />
              : <KeyRound size={26} color="var(--primary)" />}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
          {stepTitles[step]}
        </div>

        {/* Subtitle */}
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {step === 'email' && "Enter your registered email and we'll send a 6-digit OTP."}
          {step === 'otp'   && <><span>OTP sent to </span><strong>{email}</strong><span>. Valid for 10 minutes.</span></>}
          {step === 'reset' && "Choose a new password for your account."}
          {step === 'done'  && "Your password has been reset. You can now sign in."}
        </div>

        {error && (
          <div className="vb-alert vb-alert-danger" style={{ marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Step: email */}
        {step === 'email' && (
          <form onSubmit={sendOtp}>
            <div className="vb-form-group">
              <label className="vb-form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="vb-input" style={{ paddingLeft: 36 }}
                  type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoFocus required
                />
              </div>
            </div>
            <button type="submit" className="vb-btn vb-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}>
              {loading ? <><span className="vb-spin" style={{ width: 15, height: 15 }} /> Sending...</> : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step: otp */}
        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <div className="vb-form-group">
              <label className="vb-form-label">6-digit OTP</label>
              <input
                className="vb-input"
                style={{ textAlign: 'center', fontSize: 22, letterSpacing: 10, fontWeight: 700 }}
                type="text" inputMode="numeric" maxLength={6}
                placeholder="------"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>
            <button type="submit" className="vb-btn vb-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading || otp.length !== 6}>
              {loading ? <><span className="vb-spin" style={{ width: 15, height: 15 }} /> Verifying...</> : 'Verify OTP'}
            </button>
            <button type="button" className="vb-btn vb-btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 13 }}
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}>
              ← Change email
            </button>
          </form>
        )}

        {/* Step: reset */}
        {step === 'reset' && (
          <form onSubmit={resetPassword}>
            <div className="vb-form-group">
              <label className="vb-form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="vb-input" style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoFocus required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="vb-form-group">
              <label className="vb-form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="vb-input" style={{ paddingLeft: 36 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="vb-btn vb-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}>
              {loading ? <><span className="vb-spin" style={{ width: 15, height: 15 }} /> Resetting...</> : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <button className="vb-btn vb-btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onClose}>
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Login Page ─────────────────────────────────────────────────────────
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

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

  const demoAccounts = [
    { role: 'Admin',   email: 'admin@vendorbridge.com',   pass: 'admin123' },
    { role: 'Officer', email: 'officer@vendorbridge.com', pass: 'officer123' },
    { role: 'Vendor',  email: 'vendor@vendorbridge.com',  pass: 'vendor123' },
    { role: 'Manager', email: 'manager@vendorbridge.com', pass: 'manager123' },
  ];

  return (
    <div className="vb-auth-page">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="vb-auth-card">
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
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="vb-input" style={{ paddingLeft: 36 }}
                  type="email" placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="vb-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="vb-form-label" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--primary)', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="vb-input" style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit" className="vb-btn vb-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 16 }}
              disabled={loading}
            >
              {loading
                ? <><span className="vb-spin" style={{ width: 16, height: 16 }} /> Signing in...</>
                : <>Sign in <ArrowRight size={15} /></>}
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
