import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Eye, Search, Download } from 'lucide-react';

const seedPOs = [
  { _id: 'po1', po_number: 'PO-2024-001', rfq_title: 'IT Equipment Q2 2024', vendor_name: 'TechCore Ltd', amount: 443680, status: 'Generated', created_at: '2024-05-15' },
  { _id: 'po2', po_number: 'PO-2024-002', rfq_title: 'Office Furniture', vendor_name: 'Infra Supplies Co', amount: 185000, status: 'Sent', created_at: '2024-05-14' },
  { _id: 'po3', po_number: 'PO-2024-003', rfq_title: 'Annual Stationery Bundle', vendor_name: 'QuickPrint Co', amount: 54600, status: 'Accepted', created_at: '2024-05-12' },
  { _id: 'po4', po_number: 'PO-2024-004', rfq_title: 'Cloud Services Renewal', vendor_name: 'ServTech Solutions', amount: 120000, status: 'Completed', created_at: '2024-05-10' },
];

const statusStyle = {
  Generated: 'vb-badge-info', Sent: 'vb-badge-info',
  Accepted: 'vb-badge-success', Completed: 'vb-badge-neutral',
};

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/purchase-orders', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setPOs(Array.isArray(data) ? data : []))
      .catch(() => setPOs(seedPOs))
      .finally(() => setLoading(false));
  }, []);

  const display = pos.length ? pos : seedPOs;
  const filtered = display.filter(p => {
    const q = search.toLowerCase();
    return !q || p.po_number?.toLowerCase().includes(q) || p.vendor_name?.toLowerCase().includes(q) || p.rfq_title?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Purchase Orders</div>
          <div className="vb-page-subtitle">Track issued purchase orders and their delivery status</div>
        </div>
      </div>

      <div className="vb-card vb-card-body">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div className="vb-search">
            <Search size={15} />
            <input placeholder="Search PO, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading...</div>
        ) : (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>RFQ</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => (
                  <tr key={po.id || po._id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{po.po_number}</td>
                    <td>{po.rfq_title}</td>
                    <td>{po.vendor_name}</td>
                    <td style={{ fontWeight: 600 }}>{fmtRupee(Number(po.grand_total) || Number(po.subtotal) || Number(po.amount) || 0)}</td>
                    <td><span className={`vb-badge ${statusStyle[po.status] || 'vb-badge-neutral'}`}>{po.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(po.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <Link to={`/purchase-orders/${po.id || po._id}`} className="vb-btn vb-btn-ghost vb-btn-xs">
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
