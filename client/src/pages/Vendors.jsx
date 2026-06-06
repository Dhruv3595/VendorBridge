import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Search, Eye, Edit2, Star, Building2, Phone, Mail, Hash } from 'lucide-react';

const seedVendors = [
  { _id: '1', name: 'TechCore Ltd', category: 'IT Hardware', gst_number: '27AAACT1234A1Z5', phone: '+91 98765 43210', email: 'info@techcore.com', status: 'Active', rating: 4.8 },
  { _id: '2', name: 'Infra Supplies Co', category: 'Furniture', gst_number: '07AABCI5678B2Z3', phone: '+91 97654 32109', email: 'sales@infrasupply.com', status: 'Active', rating: 4.5 },
  { _id: '3', name: 'FastLog Services', category: 'Logistics', gst_number: '33AACFL9012C3Z1', phone: '+91 96543 21098', email: 'ops@fastlog.in', status: 'Active', rating: 4.6 },
  { _id: '4', name: 'QuickPrint Co', category: 'Stationery', gst_number: '29AACQP3456D4Z9', phone: '+91 95432 10987', email: 'print@quickprint.com', status: 'Pending', rating: 4.2 },
  { _id: '5', name: 'ServTech Solutions', category: 'Services', gst_number: '19AACST7890E5Z7', phone: '+91 94321 09876', email: 'contact@servtech.com', status: 'Active', rating: 4.3 },
  { _id: '6', name: 'Globalmart Traders', category: 'IT Hardware', gst_number: '06AABCG2345F6Z6', phone: '+91 93210 98765', email: 'trade@globalmart.in', status: 'Blocked', rating: 3.1 },
];

const filterOptions = ['All', 'Active', 'Pending', 'Blocked'];

const statusStyles = {
  Active: 'vb-badge-success',
  Pending: 'vb-badge-warning',
  Blocked: 'vb-badge-danger',
};

function StarRating({ rating }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}>
      <Star size={13} fill="#F59E0B" />
      {rating.toFixed(1)}
    </span>
  );
}

export default function Vendors() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const canManage = ['Admin', 'Officer'].includes(user?.role);

  useEffect(() => {
    fetch('/api/vendors', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setVendors(Array.isArray(data) ? data : []))
      .catch(() => setVendors(seedVendors))
      .finally(() => setLoading(false));
  }, []);

  const displayVendors = (vendors.length ? vendors : seedVendors);
  const filtered = displayVendors.filter(v => {
    const matchFilter = filter === 'All' || v.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q) || v.gst_number?.toLowerCase().includes(q) || v.phone?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    All: displayVendors.length,
    Active: displayVendors.filter(v => v.status === 'Active').length,
    Pending: displayVendors.filter(v => v.status === 'Pending').length,
    Blocked: displayVendors.filter(v => v.status === 'Blocked').length,
  };

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Vendors</div>
          <div className="vb-page-subtitle">Manage supplier profiles and registrations</div>
        </div>
        {canManage && (
          <div className="vb-page-actions">
            <Link to="/vendors/add" className="vb-btn vb-btn-primary">
              <Plus size={15} /> Add Vendor
            </Link>
          </div>
        )}
      </div>

      <div className="vb-card vb-card-body">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div className="vb-filter-tabs">
            {filterOptions.map(opt => (
              <button
                key={opt}
                className={`vb-filter-tab${filter === opt ? ' active' : ''}`}
                onClick={() => setFilter(opt)}
              >
                {opt}
                <span style={{ marginLeft: 5, padding: '0 6px', background: filter === opt ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: filter === opt ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {counts[opt]}
                </span>
              </button>
            ))}
          </div>
          <div className="vb-search">
            <Search size={15} />
            <input
              placeholder="Search vendor, GST, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div className="vb-empty">
            <div className="vb-empty-icon"><Building2 size={24} /></div>
            <div className="vb-empty-title">No vendors found</div>
            <div className="vb-empty-desc">Try adjusting your search or filter criteria</div>
            {canManage && <Link to="/vendors/add" className="vb-btn vb-btn-primary"><Plus size={15} /> Add First Vendor</Link>}
          </div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>GST No.</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Rating</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="vb-avatar" style={{ width: 32, height: 32, fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {v.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{v.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="vb-tag">{v.category || '—'}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {v.gst_number || '—'}
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={11} /> {v.phone || '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`vb-badge ${statusStyles[v.status] || 'vb-badge-neutral'}`}>
                        <span className="vb-badge-dot" style={{ background: v.status === 'Active' ? 'var(--success)' : v.status === 'Blocked' ? 'var(--danger)' : 'var(--warning)' }} />
                        {v.status}
                      </span>
                    </td>
                    <td><StarRating rating={v.rating || 0} /></td>
                    {canManage && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/vendors/${v._id}`} className="vb-btn vb-btn-ghost vb-btn-xs" title="View">
                            <Eye size={13} />
                          </Link>
                          <Link to={`/vendors/${v._id}/edit`} className="vb-btn vb-btn-ghost vb-btn-xs" title="Edit">
                            <Edit2 size={13} />
                          </Link>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {displayVendors.length} vendors
        </div>
      </div>
    </>
  );
}
