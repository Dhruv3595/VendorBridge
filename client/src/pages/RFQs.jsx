import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Search, Eye, GitCompare, Send, Edit2, ClipboardList } from 'lucide-react';

const seedRFQs = [
  { _id: 'r1', rfq_number: 'RFQ-2024-001', title: 'IT Equipment Q2 2024', category: 'IT Hardware', deadline: '2024-06-15', vendors_count: 4, quotations_count: 3, status: 'Quotation Received', created_by: 'Ravi Kumar' },
  { _id: 'r2', rfq_number: 'RFQ-2024-002', title: 'Office Furniture Procurement', category: 'Furniture', deadline: '2024-06-20', vendors_count: 3, quotations_count: 2, status: 'Published', created_by: 'Priya Sharma' },
  { _id: 'r3', rfq_number: 'RFQ-2024-003', title: 'Annual Stationery Bundle', category: 'Stationery', deadline: '2024-06-10', vendors_count: 5, quotations_count: 5, status: 'Approval Pending', created_by: 'Ravi Kumar' },
  { _id: 'r4', rfq_number: 'RFQ-2024-004', title: 'Logistics Partner Q3', category: 'Logistics', deadline: '2024-07-01', vendors_count: 2, quotations_count: 0, status: 'Draft', created_by: 'Ankit Patel' },
  { _id: 'r5', rfq_number: 'RFQ-2024-005', title: 'Cloud Services Renewal', category: 'Services', deadline: '2024-05-30', vendors_count: 3, quotations_count: 3, status: 'PO Generated', created_by: 'Ravi Kumar' },
  { _id: 'r6', rfq_number: 'RFQ-2024-006', title: 'Server Hardware Upgrade', category: 'IT Hardware', deadline: '2024-07-15', vendors_count: 4, quotations_count: 4, status: 'Approved', created_by: 'Priya Sharma' },
];

const statusStyle = {
  'Draft': 'vb-badge-neutral',
  'Published': 'vb-badge-info',
  'Quotation Received': 'vb-badge-purple',
  'Approval Pending': 'vb-badge-warning',
  'Approved': 'vb-badge-success',
  'Rejected': 'vb-badge-danger',
  'PO Generated': 'vb-badge-teal',
};

const allStatuses = ['All', 'Draft', 'Published', 'Quotation Received', 'Approval Pending', 'Approved', 'PO Generated'];

function isDeadlinePast(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function RFQs() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const canCreate = user?.role === 'Officer';

  useEffect(() => {
    fetch('/api/rfqs', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setRfqs(Array.isArray(data) ? data : []))
      .catch(() => setRfqs(seedRFQs))
      .finally(() => setLoading(false));
  }, []);

  const displayRFQs = rfqs.length ? rfqs : seedRFQs;
  const filtered = displayRFQs.filter(r => {
    const matchFilter = filter === 'All' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.rfq_number?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Request for Quotations</div>
          <div className="vb-page-subtitle">Manage procurement requests and vendor assignments</div>
        </div>
        {canCreate && (
          <div className="vb-page-actions">
            <Link to="/rfqs/new" className="vb-btn vb-btn-primary">
              <Plus size={15} /> New RFQ
            </Link>
          </div>
        )}
      </div>

      <div className="vb-card vb-card-body">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div className="vb-filter-tabs" style={{ flexWrap: 'wrap' }}>
            {allStatuses.map(s => (
              <button
                key={s}
                className={`vb-filter-tab${filter === s ? ' active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
                <span style={{ marginLeft: 4, padding: '0 5px', background: filter === s ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: filter === s ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {s === 'All' ? displayRFQs.length : displayRFQs.filter(r => r.status === s).length}
                </span>
              </button>
            ))}
          </div>
          <div className="vb-search">
            <Search size={15} />
            <input placeholder="Search RFQ number, title..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading RFQs...</div>
        ) : filtered.length === 0 ? (
          <div className="vb-empty">
            <div className="vb-empty-icon"><ClipboardList size={24} /></div>
            <div className="vb-empty-title">No RFQs found</div>
            <div className="vb-empty-desc">Create your first RFQ to start the procurement workflow</div>
            {canCreate && <Link to="/rfqs/new" className="vb-btn vb-btn-primary"><Plus size={15} /> Create RFQ</Link>}
          </div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>RFQ No.</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Vendors</th>
                  <th>Quotations</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>{r.rfq_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, maxWidth: 220 }}>{r.title}</div>
                    </td>
                    <td><span className="vb-tag">{r.category}</span></td>
                    <td>
                      <span style={{ color: isDeadlinePast(r.deadline) ? 'var(--danger)' : 'var(--text-secondary)', fontSize: 13 }}>
                        {new Date(r.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {isDeadlinePast(r.deadline) && <span style={{ fontSize: 11, marginLeft: 4, color: 'var(--danger)' }}>Expired</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.vendors_count || 0}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> assigned</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.quotations_count || 0}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> received</span>
                    </td>
                    <td>
                      <span className={`vb-badge ${statusStyle[r.status] || 'vb-badge-neutral'}`}>{r.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.created_by || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link to={`/rfqs/${r._id}/quotations/compare`} className="vb-btn vb-btn-ghost vb-btn-xs" title="View">
                          <Eye size={13} />
                        </Link>
                        {canCreate && r.status === 'Draft' && (
                          <Link to={`/rfqs/${r._id}/edit`} className="vb-btn vb-btn-ghost vb-btn-xs" title="Edit">
                            <Edit2 size={13} />
                          </Link>
                        )}
                        {(r.quotations_count > 0) && ['Quotation Received', 'Approval Pending', 'Approved'].includes(r.status) && (
                          <Link to={`/rfqs/${r._id}/quotations/compare`} className="vb-btn vb-btn-outline vb-btn-xs" title="Compare">
                            <GitCompare size={13} />
                          </Link>
                        )}
                        {user?.role === 'Vendor' && ['Published', 'Quotation Received'].includes(r.status) && (
                          <Link to={`/rfqs/${r._id}/quotations/submit`} className="vb-btn vb-btn-outline vb-btn-xs">
                            <Send size={12} /> Submit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {displayRFQs.length} RFQs
        </div>
      </div>
    </>
  );
}
