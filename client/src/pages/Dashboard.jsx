import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ClipboardList, CheckSquare, ShoppingBag, AlertTriangle,
  TrendingUp, TrendingDown, Users, Building2, FileText,
  IndianRupee, Clock, CheckCircle, XCircle, Plus, Eye
} from 'lucide-react';

/* ── Seed data (displayed when API empty) ── */
const spendTrend = [
  { month: 'Dec', amount: 210000 },
  { month: 'Jan', amount: 280000 },
  { month: 'Feb', amount: 240000 },
  { month: 'Mar', amount: 360000 },
  { month: 'Apr', amount: 320000 },
  { month: 'May', amount: 480000 },
];

const rfqStatusData = [
  { name: 'Draft', value: 4, color: '#9CA3AF' },
  { name: 'Published', value: 8, color: '#3B82F6' },
  { name: 'Quotation Received', value: 6, color: '#8B5CF6' },
  { name: 'Approval Pending', value: 3, color: '#F59E0B' },
  { name: 'Approved', value: 5, color: '#16A34A' },
  { name: 'PO Generated', value: 7, color: '#0F766E' },
];

const categorySpend = [
  { category: 'IT Hardware', amount: 480000 },
  { category: 'Furniture', amount: 320000 },
  { category: 'Logistics', amount: 230000 },
  { category: 'Stationery', amount: 210000 },
  { category: 'Services', amount: 170000 },
];

const approvalTrend = [
  { month: 'Jan', Approved: 12, Pending: 4, Rejected: 2 },
  { month: 'Feb', Approved: 8, Pending: 6, Rejected: 1 },
  { month: 'Mar', Approved: 15, Pending: 3, Rejected: 3 },
  { month: 'Apr', Approved: 10, Pending: 7, Rejected: 1 },
  { month: 'May', Approved: 18, Pending: 2, Rejected: 2 },
];

const topVendors = [
  { name: 'TechCore Ltd', spend: 420000, pos: 6, rating: 4.8 },
  { name: 'Infra Supplies', spend: 310000, pos: 4, rating: 4.5 },
  { name: 'FastLog Services', spend: 190000, pos: 3, rating: 4.6 },
  { name: 'QuickPrint Co', spend: 140000, pos: 5, rating: 4.2 },
];

function fmtRupee(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, bg }) {
  return (
    <div className="vb-stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="vb-stat-card-icon" style={{ background: bg, color }}>
          <Icon size={18} />
        </div>
        {trend && (
          <div className={`vb-stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div className="vb-stat-number">{value ?? '—'}</div>
      <div className="vb-stat-label">{label}</div>
    </div>
  );
}

/* ── Officer Dashboard ── */
function OfficerDashboard({ stats }) {
  const recentPOs = stats?.recentPOs || [];
  const spend = stats?.spendingTrends?.length ? stats.spendingTrends : spendTrend;

  return (
    <>
      {/* Stat cards */}
      <div className="vb-grid-4 vb-mb-6">
        <StatCard icon={ClipboardList} label="Active RFQs" value={stats?.activeRfqs ?? 12}
          trend="+2 this week" trendUp color="#2563EB" bg="#EFF6FF" />
        <StatCard icon={CheckSquare} label="Pending Approvals" value={stats?.pendingApprovals ?? 3}
          trend="needs action" trendUp={false} color="#D97706" bg="#FFFBEB" />
        <StatCard icon={ShoppingBag} label="POs This Month" value={stats?.posThisMonth ?? 7}
          trend="+15%" trendUp color="#16A34A" bg="#F0FDF4" />
        <StatCard icon={AlertTriangle} label="Overdue Invoices" value={stats?.overdueInvoices ?? 2}
          trend="action needed" trendUp={false} color="#DC2626" bg="#FEF2F2" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Spend trend */}
        <div className="vb-chart-card">
          <div className="vb-chart-title">Monthly Spend Trend</div>
          <div className="vb-chart-subtitle">Last 6 months procurement expenditure</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={spend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
              <Bar dataKey="amount" fill="#714B67" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RFQ pipeline donut */}
        <div className="vb-chart-card">
          <div className="vb-chart-title">RFQ Pipeline</div>
          <div className="vb-chart-subtitle">Status distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={rfqStatusData} innerRadius={45} outerRadius={70}
                dataKey="value" nameKey="name" paddingAngle={2}>
                {rfqStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11.5, marginTop: 4 }}>
            {rfqStatusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spend by category + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Spend by Category</div>
          <div className="vb-chart-subtitle">Current fiscal year</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categorySpend} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={80} />
              <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
              <Bar dataKey="amount" fill="#17BC76" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/rfqs/new" className="vb-btn vb-btn-primary" style={{ justifyContent: 'center' }}>
              <Plus size={15} /> New RFQ
            </Link>
            <Link to="/vendors/add" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <Plus size={15} /> Add Vendor
            </Link>
            <Link to="/invoices" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <Eye size={15} /> View Invoices
            </Link>
            <Link to="/reports" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <Eye size={15} /> Reports & Analytics
            </Link>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="vb-section-title">Total Spend (May)</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>₹4.8L</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              ↑ 50% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Recent POs table */}
      <div className="vb-card vb-card-body" style={{ marginBottom: 16 }}>
        <div className="vb-flex-between" style={{ marginBottom: 14 }}>
          <div className="vb-section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            Recent Purchase Orders
          </div>
          <Link to="/purchase-orders" className="vb-btn vb-btn-outline vb-btn-sm">View all</Link>
        </div>
        <div className="vb-table-wrap" style={{ border: 'none' }}>
          <table className="vb-table">
            <thead>
              <tr>
                <th>PO Number</th><th>RFQ</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPOs.length === 0 ? (
                [
                  { id: 1, po_number: 'PO-2024-001', rfq_title: 'IT Equipment Q2', vendor_name: 'TechCore Ltd', amount: 420000, status: 'Generated', created_at: '2024-05-10' },
                  { id: 2, po_number: 'PO-2024-002', rfq_title: 'Office Furniture', vendor_name: 'Infra Supplies', amount: 180000, status: 'Sent', created_at: '2024-05-08' },
                  { id: 3, po_number: 'PO-2024-003', rfq_title: 'Stationery Bundle', vendor_name: 'QuickPrint Co', amount: 52000, status: 'Accepted', created_at: '2024-05-06' },
                ].map(po => (
                  <tr key={po.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/purchase-orders/${po.id}`}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{po.po_number}</td>
                    <td>{po.rfq_title}</td>
                    <td>{po.vendor_name}</td>
                    <td style={{ fontWeight: 600 }}>{fmtRupee(po.grand_total || po.amount || 0)}</td>
                    <td><StatusBadge status={po.status} /></td>
                    <td className="text-muted">{po.created_at}</td>
                  </tr>
                ))
              ) : recentPOs.map(po => (
                <tr key={po.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/purchase-orders/${po.id}`}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{po.po_number}</td>
                  <td>{po.rfq_title || '-'}</td>
                  <td>{po.vendor_name || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{fmtRupee(po.grand_total || po.amount || 0)}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td className="text-muted">{new Date(po.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Admin Dashboard ── */
function AdminDashboard({ stats }) {
  return (
    <>
      <div className="vb-grid-4 vb-mb-6">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 24}
          trend="+3 this month" trendUp color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={Building2} label="Active Vendors" value={stats?.activeRfqs ?? 18}
          trend="2 pending" trendUp={false} color="#16A34A" bg="#F0FDF4" />
        <StatCard icon={ClipboardList} label="Total RFQs" value={stats?.posThisMonth ?? 33}
          trend="+5 this week" trendUp color="#2563EB" bg="#EFF6FF" />
        <StatCard icon={IndianRupee} label="Total Spend (YTD)" value="₹14.2L"
          trend="+22% YoY" trendUp color="#D97706" bg="#FFFBEB" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Monthly Procurement Trend</div>
          <div className="vb-chart-subtitle">Revenue vs spend over last 6 months</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spendTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
              <Line type="monotone" dataKey="amount" stroke="#714B67" strokeWidth={2.5} dot={{ r: 4, fill: '#714B67' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Spend by Category</div>
          <div className="vb-chart-subtitle">Current fiscal year breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categorySpend} layout="vertical" margin={{ right: 20, left: 10 }}>
              <XAxis type="number" tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} width={80} />
              <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
              <Bar dataKey="amount" fill="#714B67" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top vendors table */}
      <div className="vb-card vb-card-body">
        <div className="vb-section-title">Top Vendors by Spend</div>
        <div className="vb-table-wrap" style={{ border: 'none' }}>
          <table className="vb-table">
            <thead><tr><th>Vendor</th><th>Spend</th><th>POs</th><th>Rating</th><th>Share</th></tr></thead>
            <tbody>
              {topVendors.map(v => (
                <tr key={v.name}>
                  <td style={{ fontWeight: 600 }}>{v.name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmtRupee(v.spend)}</td>
                  <td>{v.pos}</td>
                  <td><span style={{ color: '#F59E0B' }}>★</span> {v.rating}</td>
                  <td>
                    <div style={{ width: 100 }}>
                      <div className="vb-progress">
                        <div className="vb-progress-bar" style={{ width: `${(v.spend / 420000) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Vendor Dashboard ── */
function VendorDashboard({ stats }) {
  const quotationSuccess = [
    { name: 'Won', value: 8, color: '#16A34A' },
    { name: 'Lost', value: 5, color: '#9CA3AF' },
    { name: 'Pending', value: 3, color: '#F59E0B' },
  ];

  return (
    <>
      <div className="vb-grid-4 vb-mb-6">
        <StatCard icon={ClipboardList} label="Assigned RFQs" value={stats?.activeRfqs ?? 5}
          trend="2 new" trendUp color="#2563EB" bg="#EFF6FF" />
        <StatCard icon={FileText} label="Submitted Quotations" value={stats?.posThisMonth ?? 8}
          trend="this month" trendUp color="#8B5CF6" bg="#F5F3FF" />
        <StatCard icon={CheckSquare} label="Selected Quotations" value={stats?.pendingApprovals ?? 3}
          trend="+1 this week" trendUp color="#16A34A" bg="#F0FDF4" />
        <StatCard icon={AlertTriangle} label="Pending Payment" value={stats?.overdueInvoices ?? 2}
          trend="₹1.2L due" trendUp={false} color="#DC2626" bg="#FEF2F2" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Quotation Success Rate</div>
          <div className="vb-chart-subtitle">Win/loss breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={quotationSuccess} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {quotationSuccess.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
            {quotationSuccess.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/rfqs" className="vb-btn vb-btn-primary" style={{ justifyContent: 'center' }}>
              <Eye size={15} /> View Assigned RFQs
            </Link>
            <Link to="/quotations" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <FileText size={15} /> My Quotations
            </Link>
            <Link to="/purchase-orders" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <ShoppingBag size={15} /> Purchase Orders
            </Link>
            <Link to="/invoices" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <Eye size={15} /> Invoice Status
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Manager Dashboard ── */
function ManagerDashboard({ stats }) {
  return (
    <>
      <div className="vb-grid-4 vb-mb-6">
        <StatCard icon={Clock} label="Pending Approvals" value={stats?.pendingApprovals ?? 4}
          trend="needs action" trendUp={false} color="#D97706" bg="#FFFBEB" />
        <StatCard icon={CheckCircle} label="Approved This Month" value={stats?.posThisMonth ?? 12}
          trend="+3 vs last" trendUp color="#16A34A" bg="#F0FDF4" />
        <StatCard icon={XCircle} label="Rejected Requests" value={stats?.overdueInvoices ?? 2}
          trend="this month" trendUp={false} color="#DC2626" bg="#FEF2F2" />
        <StatCard icon={TrendingUp} label="Avg Approval Time" value="1.4 days"
          trend="-0.3 vs last" trendUp color="#2563EB" bg="#EFF6FF" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Approval Trend</div>
          <div className="vb-chart-subtitle">Monthly approval status breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={approvalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Approved" fill="#16A34A" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="Pending" fill="#F59E0B" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="Rejected" fill="#DC2626" radius={[0, 0, 4, 4]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="vb-card vb-card-body">
          <div className="vb-section-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/approvals" className="vb-btn vb-btn-primary" style={{ justifyContent: 'center' }}>
              <CheckSquare size={15} /> Review Pending
            </Link>
            <Link to="/activity" className="vb-btn vb-btn-outline" style={{ justifyContent: 'center' }}>
              <Eye size={15} /> Workflow Monitor
            </Link>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="vb-section-title">Pending by Category</div>
            {[
              { cat: 'IT Hardware', count: 2 },
              { cat: 'Furniture', count: 1 },
              { cat: 'Services', count: 1 },
            ].map(item => (
              <div key={item.cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.cat}</span>
                <span className="vb-badge vb-badge-warning">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Status Badge Helper ── */
function StatusBadge({ status }) {
  const map = {
    Generated: 'vb-badge-info', Sent: 'vb-badge-info',
    Accepted: 'vb-badge-success', Completed: 'vb-badge-neutral',
    Approved: 'vb-badge-success', Paid: 'vb-badge-success',
    Draft: 'vb-badge-neutral', Published: 'vb-badge-info',
    'Approval Pending': 'vb-badge-warning', Pending: 'vb-badge-warning',
    Rejected: 'vb-badge-danger', Overdue: 'vb-badge-danger', Blocked: 'vb-badge-danger',
    Active: 'vb-badge-success', 'PO Generated': 'vb-badge-teal',
    'Quotation Received': 'vb-badge-purple',
  };
  return <span className={`vb-badge ${map[status] || 'vb-badge-neutral'}`}>{status}</span>;
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const role = user?.role;

  const roleTitle = {
    Admin: 'Admin Overview',
    Officer: 'Procurement Dashboard',
    Vendor: 'Vendor Portal',
    Manager: 'Approval Workspace',
  };

  return (
    <>
      {/* Page header */}
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">{roleTitle[role] || 'Dashboard'}</div>
          <div className="vb-page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        {role === 'Officer' && (
          <div className="vb-page-actions">
            <Link to="/rfqs/new" className="vb-btn vb-btn-primary"><Plus size={15} /> New RFQ</Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="vb-spinner">
          <div className="vb-spin" />
          Loading dashboard...
        </div>
      ) : (
        <>
          {role === 'Admin' && <AdminDashboard stats={stats} />}
          {role === 'Officer' && <OfficerDashboard stats={stats} />}
          {role === 'Vendor' && <VendorDashboard stats={stats} />}
          {role === 'Manager' && <ManagerDashboard stats={stats} />}
        </>
      )}
    </>
  );
}
