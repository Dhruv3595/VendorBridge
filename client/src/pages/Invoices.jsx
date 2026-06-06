import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';

const seedInvoices = [
  { _id: 'i1', invoice_number: 'INV-2024-001', po_number: 'PO-2024-001', vendor_name: 'TechCore Ltd', amount: 443680, due_date: '2024-06-14', status: 'Pending Payment' },
  { _id: 'i2', invoice_number: 'INV-2024-002', po_number: 'PO-2024-002', vendor_name: 'Infra Supplies Co', amount: 185000, due_date: '2024-06-13', status: 'Paid' },
  { _id: 'i3', invoice_number: 'INV-2024-003', po_number: 'PO-2024-003', vendor_name: 'QuickPrint Co', amount: 54600, due_date: '2024-06-11', status: 'Paid' },
  { _id: 'i4', invoice_number: 'INV-2024-004', po_number: 'PO-2024-004', vendor_name: 'ServTech Solutions', amount: 120000, due_date: '2024-05-25', status: 'Overdue' },
];

const statusStyle = {
  'Paid': 'vb-badge-success',
  'Pending Payment': 'vb-badge-warning',
  'Overdue': 'vb-badge-danger',
};

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

const filterOptions = ['All', 'Pending Payment', 'Paid', 'Overdue'];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/invoices', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices(seedInvoices))
      .finally(() => setLoading(false));
  }, []);

  const display = invoices.length ? invoices : seedInvoices;
  const filtered = display.filter(inv => {
    const matchFilter = filter === 'All' || inv.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || inv.invoice_number?.toLowerCase().includes(q) || inv.vendor_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Invoices</div>
          <div className="vb-page-subtitle">Track payment status and manage vendor invoices</div>
        </div>
      </div>

      <div className="vb-card vb-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div className="vb-filter-tabs">
            {filterOptions.map(opt => (
              <button key={opt} className={`vb-filter-tab${filter === opt ? ' active' : ''}`} onClick={() => setFilter(opt)}>
                {opt}
                <span style={{ marginLeft: 4, padding: '0 5px', background: filter === opt ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: filter === opt ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {opt === 'All' ? display.length : display.filter(i => i.status === opt).length}
                </span>
              </button>
            ))}
          </div>
          <div className="vb-search">
            <Search size={15} />
            <input placeholder="Search invoice, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading invoices...</div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>PO No.</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{inv.po_number}</td>
                    <td>{inv.vendor_name}</td>
                    <td style={{ fontWeight: 600 }}>{fmtRupee(inv.grand_total || inv.amount || 0)}</td>
                    <td style={{ color: inv.status === 'Overdue' ? 'var(--danger)' : 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {inv.status === 'Overdue' && <span style={{ fontSize: 11, marginLeft: 4 }}>⚠ Overdue</span>}
                    </td>
                    <td><span className={`vb-badge ${statusStyle[inv.status] || 'vb-badge-neutral'}`}>{inv.status}</span></td>
                    <td>
                      <Link to={`/invoices/${inv._id}`} className="vb-btn vb-btn-ghost vb-btn-xs">
                        <Eye size={13} />
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
