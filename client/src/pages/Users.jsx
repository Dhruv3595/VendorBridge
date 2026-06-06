import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Plus, Shield, UserCircle, Edit2, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const seedUsers = [
  { _id: 'u1', name: 'System Admin', email: 'admin@vendorbridge.com', role: 'Admin', status: 'Active' },
  { _id: 'u2', name: 'Ravi Kumar', email: 'ravi.k@vendorbridge.com', role: 'Officer', status: 'Active' },
  { _id: 'u3', name: 'Priya Sharma', email: 'priya.s@vendorbridge.com', role: 'Officer', status: 'Active' },
  { _id: 'u4', name: 'Arjun Mehta', email: 'arjun.m@vendorbridge.com', role: 'Manager', status: 'Active' },
  { _id: 'u5', name: 'Meera Singh', email: 'meera.s@vendorbridge.com', role: 'Manager', status: 'Active' },
  { _id: 'u6', name: 'TechCore Ltd', email: 'billing@techcore.com', role: 'Vendor', status: 'Active' },
];

const roleStyles = {
  Admin: { color: '#7C3AED', bg: '#F5F3FF' },
  Manager: { color: '#16A34A', bg: '#F0FDF4' },
  Officer: { color: '#2563EB', bg: '#EFF6FF' },
  Vendor: { color: '#D97706', bg: '#FFFBEB' },
};

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers(seedUsers))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const display = users.length ? users : seedUsers;
  const filtered = display.filter(u => {
    const matchRole = filterRole === 'All' || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const roles = ['All', 'Admin', 'Manager', 'Officer', 'Vendor'];

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">User Management</div>
          <div className="vb-page-subtitle">Manage system access, roles, and permissions</div>
        </div>
        <div className="vb-page-actions">
          <button className="vb-btn vb-btn-primary">
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
                  {r === 'All' ? display.length : display.filter(u => u.role === r).length}
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
                  <tr key={u._id}>
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
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="vb-btn vb-btn-ghost vb-btn-xs" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        {u._id !== user?._id && (
                          <button className="vb-btn vb-btn-ghost vb-btn-xs" style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
