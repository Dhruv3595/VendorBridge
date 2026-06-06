import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Eye, FileText } from 'lucide-react';

const seedQuotations = [
  { _id: 'q1', rfq_number: 'RFQ-2024-001', rfq_title: 'IT Equipment Q2 2024', vendor_name: 'TechCore Ltd', total_amount: 420000, gst_percent: 18, delivery_days: 7, status: 'Selected', submitted_at: '2024-05-12' },
  { _id: 'q2', rfq_number: 'RFQ-2024-001', rfq_title: 'IT Equipment Q2 2024', vendor_name: 'Globalmart Traders', total_amount: 390000, gst_percent: 18, delivery_days: 12, status: 'Submitted', submitted_at: '2024-05-11' },
  { _id: 'q3', rfq_number: 'RFQ-2024-002', rfq_title: 'Office Furniture', vendor_name: 'Infra Supplies Co', total_amount: 185000, gst_percent: 12, delivery_days: 14, status: 'Submitted', submitted_at: '2024-05-14' },
  { _id: 'q4', rfq_number: 'RFQ-2024-003', rfq_title: 'Annual Stationery Bundle', vendor_name: 'QuickPrint Co', total_amount: 52000, gst_percent: 5, delivery_days: 3, status: 'Selected', submitted_at: '2024-05-10' },
  { _id: 'q5', rfq_number: 'RFQ-2024-003', rfq_title: 'Annual Stationery Bundle', vendor_name: 'PrintMart', total_amount: 58000, gst_percent: 5, delivery_days: 5, status: 'Draft', submitted_at: '2024-05-09' },
];

const statusStyle = {
  Draft: 'vb-badge-neutral',
  Submitted: 'vb-badge-info',
  Selected: 'vb-badge-success',
  Rejected: 'vb-badge-danger',
};

const filterOptions = ['All', 'Draft', 'Submitted', 'Selected', 'Rejected'];

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/quotations', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setQuotations(Array.isArray(data) ? data : []))
      .catch(() => setQuotations(seedQuotations))
      .finally(() => setLoading(false));
  }, []);

  const display = quotations.length ? quotations : seedQuotations;
  const filtered = display.filter(q => {
    const matchFilter = filter === 'All' || q.status === filter;
    const qr = search.toLowerCase();
    const matchSearch = !qr || q.rfq_number?.toLowerCase().includes(qr) || q.rfq_title?.toLowerCase().includes(qr) || q.vendor_name?.toLowerCase().includes(qr);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Quotations</div>
          <div className="vb-page-subtitle">
            {user?.role === 'Vendor' ? 'Your submitted quotations' : 'All vendor quotations across RFQs'}
          </div>
        </div>
      </div>

      <div className="vb-card vb-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div className="vb-filter-tabs">
            {filterOptions.map(opt => (
              <button key={opt} className={`vb-filter-tab${filter === opt ? ' active' : ''}`} onClick={() => setFilter(opt)}>
                {opt}
                <span style={{ marginLeft: 4, padding: '0 5px', background: filter === opt ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: filter === opt ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {opt === 'All' ? display.length : display.filter(q => q.status === opt).length}
                </span>
              </button>
            ))}
          </div>
          <div className="vb-search">
            <Search size={15} />
            <input placeholder="Search RFQ, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading quotations...</div>
        ) : filtered.length === 0 ? (
          <div className="vb-empty">
            <div className="vb-empty-icon"><FileText size={24} /></div>
            <div className="vb-empty-title">No quotations found</div>
            <div className="vb-empty-desc">Quotations appear here once vendors submit them</div>
          </div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>RFQ No.</th>
                  <th>RFQ Title</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th>GST %</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id || q._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>{q.rfq_number}</td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontWeight: 500 }}>{q.rfq_title}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="vb-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {q.vendor_name?.slice(0, 2).toUpperCase()}
                        </div>
                        {q.vendor_name}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtRupee(Number(q.grand_total) || Number(q.total_amount) || 0)}</td>
                    <td>{q.tax_percent ?? q.gst_percent ?? '—'}%</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        🚚 {q.max_delivery_days ?? q.delivery_days ?? '—'} days
                      </span>
                    </td>
                    <td>
                      <span className={`vb-badge ${statusStyle[q.status] || 'vb-badge-neutral'}`}>{q.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {(() => {
                        const d = new Date(q.submitted_at);
                        return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      })()}
                    </td>
                    <td>
                      <Link to={`/rfqs/${q.rfq_id}/quotations/compare`} className="vb-btn vb-btn-ghost vb-btn-xs">
                        <Eye size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {display.length} quotations
        </div>
      </div>
    </>
  );
}
