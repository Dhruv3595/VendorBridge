import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Plus, Shield, UserCircle, Edit2, X, Save } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const roleStyles = {
  Admin:   { color: '#7C3AED', bg: '#F5F3FF' },
  Manager: { color: '#16A34A', bg: '#F0FDF4' },
  Officer: { color: '#2563EB', bg: '#EFF6FF' },
  Vendor:  { color: '#D97706', bg: '#FFFBEB' },
};

const BLANK_FORM = { name: '', email: '', role: 'Officer', phone: '', country: '', status: 'Active', password: '' };

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  // Modal state
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    fetch('/api/users', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'All' || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const roles = ['All', 'Admin', 'Manager', 'Officer', 'Vendor'];

  function openAdd() {
    setForm(BLANK_FORM);
    setFormError('');
    setEditTarget(null);
    setModal('add');
  }

  function openEdit(u) {
    setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', country: u.country || '', status: u.status || 'Active', password: '' });
    setFormError('');
    setEditTarget(u);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditTarget(null);
    setFormError('');
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.role) {
      setFormError('Name, email and role are required');
      return;
    }
    if (modal === 'add' && !form.password) {
      setFormError('Password is required for new users');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const isEdit = modal === 'edit';
      const url = isEdit ? `/api/users/${editTarget.id}` : '/api/users';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = { ...form };
      if (isEdit && !body.password) delete body.password; // don't send empty password on edit

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save user');

      if (isEdit) {
        setUsers(prev => prev.map(u => u.id === editTarget.id ? data : u));
      } else {
        setUsers(prev => [data, ...prev]);
      }
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">User Management</div>
          <div className="vb-page-subtitle">Manage system access, roles, and permissions</div>
        </div>
        <div className="vb-page-actions">
          <button className="vb-btn vb-btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      <div className="vb-card vb-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div className="vb-filter-tabs">
            {roles.map(r => (
              <button key={r} className={`vb-filter-tab${filterRole === r ? ' active' : ''}`} onClick={() => setFilterRole(r)}>
                {r}
                <span style={{ marginLeft: 4, padding: '0 5px', background: filterRole === r ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: filterRole === r ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {r === 'All' ? users.length : users.filter(u => u.role === r).length}
                </span>
              </button>
            ))}
          </div>
          <div className="vb-search">
            <Search size={15} />
            <input placeholder="Search name, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading users...</div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="vb-avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                          <UserCircle size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        backgroundColor: roleStyles[u.role]?.bg || '#f3f4f6',
                        color: roleStyles[u.role]?.color || '#4b5563'
                      }}>
                        <Shield size={12} /> {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`vb-badge ${u.status === 'Active' ? 'vb-badge-success' : 'vb-badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <button className="vb-btn vb-btn-ghost vb-btn-xs" title="Edit" onClick={() => openEdit(u)}>
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{modal === 'add' ? 'Add New User' : 'Edit User'}</div>
              <button className="vb-btn vb-btn-ghost vb-btn-xs" onClick={closeModal}><X size={16} /></button>
            </div>

            {formError && <div className="vb-alert vb-alert-danger" style={{ marginBottom: 16 }}>{formError}</div>}

            <div className="vb-form-grid">
              <div className="vb-form-group">
                <label className="vb-form-label">Full Name <span className="required">*</span></label>
                <input className="vb-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Email <span className="required">*</span></label>
                <input className="vb-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
            </div>

            <div className="vb-form-grid">
              <div className="vb-form-group">
                <label className="vb-form-label">Role <span className="required">*</span></label>
                <select className="vb-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Officer">Officer</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Status</label>
                <select className="vb-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="vb-form-grid">
              <div className="vb-form-group">
                <label className="vb-form-label">Phone</label>
                <input className="vb-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
              </div>
              <div className="vb-form-group">
                <label className="vb-form-label">Country</label>
                <input className="vb-input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="India" />
              </div>
            </div>

            <div className="vb-form-group">
              <label className="vb-form-label">
                {modal === 'add' ? 'Password' : 'New Password'} {modal === 'add' && <span className="required">*</span>}
              </label>
              <input className="vb-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={modal === 'edit' ? 'Leave blank to keep current password' : 'Set a password'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button className="vb-btn vb-btn-outline" onClick={closeModal} disabled={saving}><X size={14} /> Cancel</button>
              <button className="vb-btn vb-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="vb-spin" style={{ width: 14, height: 14 }} /> Saving...</> : <><Save size={14} /> {modal === 'add' ? 'Create User' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
