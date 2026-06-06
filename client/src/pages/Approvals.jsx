import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Eye, Clock } from 'lucide-react';

const seedApprovals = [
  { _id: 'a1', rfq_number: 'RFQ-2024-003', rfq_title: 'Annual Stationery Bundle', vendor_name: 'QuickPrint Co', amount: 54600, status: 'Pending', submitted_by: 'Ravi Kumar', submitted_at: '2024-05-10' },
  { _id: 'a2', rfq_number: 'RFQ-2024-005', rfq_title: 'Cloud Services Renewal', vendor_name: 'ServTech Solutions', amount: 120000, status: 'Approved', submitted_by: 'Priya Sharma', submitted_at: '2024-05-08' },
  { _id: 'a3', rfq_number: 'RFQ-2024-001', rfq_title: 'IT Equipment Q2 2024', vendor_name: 'TechCore Ltd', amount: 443680, status: 'Pending', submitted_by: 'Ravi Kumar', submitted_at: '2024-05-14' },
  { _id: 'a4', rfq_number: 'RFQ-2024-006', rfq_title: 'Server Hardware Upgrade', vendor_name: 'DigitalWorld Pvt Ltd', amount: 280000, status: 'Approved', submitted_by: 'Ankit Patel', submitted_at: '2024-05-05' },
  { _id: 'a5', rfq_number: 'RFQ-2024-007', rfq_title: 'Office AC Units', vendor_name: 'CoolTech HVAC', amount: 90000, status: 'Rejected', submitted_by: 'Priya Sharma', submitted_at: '2024-05-01' },
];

const statusStyle = {
  Pending: 'vb-badge-warning',
  Approved: 'vb-badge-success',
  Rejected: 'vb-badge-danger',
};

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

const filterOptions = ['All', 'Pending', 'Approved', 'Rejected'];

export default function Approvals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('/api/approvals', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setApprovals(Array.isArray(data) ? data : []))
      .catch(() => setApprovals(seedApprovals))
      .finally(() => setLoading(false));
  }, []);

  const display = approvals.length ? approvals : seedApprovals;
  const filtered = display.filter(a => filter === 'All' || a.status === filter);

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Approvals</div>
          <div className="vb-page-subtitle">
            {user?.role === 'Manager' ? 'Review and act on approval requests' : 'Approval workflow status'}
          </div>
        </div>
        {user?.role === 'Manager' && (
          <span className="vb-badge vb-badge-warning" style={{ fontSize: 13, padding: '5px 12px' }}>
            <Clock size={13} /> {display.filter(a => a.status === 'Pending').length} Pending
          </span>
        )}
      </div>

      <div className="vb-card vb-card-body">
        <div style={{ marginBottom: 16 }}>
          <div className="vb-filter-tabs">
            {filterOptions.map(opt => (
              <button key={opt} className={`vb-filter-tab${filter === opt ? ' active' : ''}`} onClick={() => setFilter(opt)}>
                {opt}
                <span style={{ marginLeft: 4, padding: '0 5px', background: filter === opt ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: filter === opt ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {opt === 'All' ? display.length : display.filter(a => a.status === opt).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading...</div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>RFQ No.</th>
                  <th>RFQ Title</th>
                  <th>Selected Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id || a._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {a.rfq_number || `RFQ-${new Date(a.created_at).getFullYear()}-${String(a.rfq_id).padStart(3,'0')}`}
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.rfq_title}</td>
                    <td>{a.vendor_name}</td>
                    <td style={{ fontWeight: 600 }}>{fmtRupee(Number(a.grand_total) || Number(a.subtotal) || Number(a.amount) || 0)}</td>
                    <td><span className={`vb-badge ${statusStyle[a.status] || 'vb-badge-neutral'}`}>{a.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{a.submitted_by || a.approver_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {(() => {
                        const d = new Date(a.acted_at || a.quotation_submitted_at || a.created_at);
                        return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      })()}
                    </td>
                    <td>
                      <Link to={`/approvals/${a.id || a._id}`} className="vb-btn vb-btn-outline vb-btn-xs" style={{ gap: 4 }}>
                        <Eye size={12} /> {user?.role === 'Manager' && a.status === 'Pending' ? 'Review' : 'View'}
                      </Link>
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
