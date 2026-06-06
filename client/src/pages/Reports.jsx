import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, TrendingUp, Building2, ShoppingBag, AlertTriangle } from 'lucide-react';

const spendTrend = [
  { month: 'Dec', amount: 210000 }, { month: 'Jan', amount: 280000 },
  { month: 'Feb', amount: 240000 }, { month: 'Mar', amount: 360000 },
  { month: 'Apr', amount: 320000 }, { month: 'May', amount: 480000 },
];

const categorySpend = [
  { category: 'IT Hardware', amount: 480000 },
  { category: 'Furniture', amount: 320000 },
  { category: 'Logistics', amount: 230000 },
  { category: 'Stationery', amount: 210000 },
  { category: 'Services', amount: 170000 },
];

const topVendors = [
  { name: 'TechCore Ltd', spend: 420000, pos: 6, share: 30 },
  { name: 'Infra Supplies', spend: 310000, pos: 4, share: 22 },
  { name: 'FastLog Services', spend: 190000, pos: 3, share: 13 },
  { name: 'QuickPrint Co', spend: 140000, pos: 5, share: 10 },
  { name: 'ServTech', spend: 120000, pos: 2, share: 8.5 },
];

const invoiceStatus = [
  { name: 'Paid', value: 14, color: '#16A34A' },
  { name: 'Pending', value: 5, color: '#F59E0B' },
  { name: 'Overdue', value: 2, color: '#DC2626' },
];

function fmtRupee(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="vb-stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div className="vb-stat-card-icon" style={{ background: bg, color }}><Icon size={18} /></div>
      </div>
      <div className="vb-stat-number">{value}</div>
      <div className="vb-stat-label">{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--success)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('May');

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Reports & Analytics</div>
          <div className="vb-page-subtitle">Procurement insights and performance metrics</div>
        </div>
        <div className="vb-page-actions">
          <select className="vb-select" style={{ width: 120, height: 36 }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
          <button className="vb-btn vb-btn-outline"><Download size={15} /> Export</button>
        </div>
      </div>

      {/* Top cards */}
      <div className="vb-grid-4 vb-mb-6">
        <StatCard icon={TrendingUp} label="Total Spend (YTD)" value="₹14.2L" color="#714B67" bg="var(--primary-light)" sub="↑ 22% vs last year" />
        <StatCard icon={Building2} label="Active Vendors" value="18" color="#16A34A" bg="#F0FDF4" sub="2 pending approval" />
        <StatCard icon={ShoppingBag} label="PO Fulfillment %" value="94%" color="#2563EB" bg="#EFF6FF" sub="↑ 3% vs last month" />
        <StatCard icon={AlertTriangle} label="Overdue Invoices" value="2" color="#DC2626" bg="#FEF2F2" sub="₹47,000 outstanding" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Monthly Spend Trend</div>
          <div className="vb-chart-subtitle">Procurement expenditure over the last 6 months</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={spendTrend} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
              <Bar dataKey="amount" fill="#714B67" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="vb-chart-card">
          <div className="vb-chart-title">Invoice Status</div>
          <div className="vb-chart-subtitle">Payment health overview</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={invoiceStatus} innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                {invoiceStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, name) => [`${v} invoices`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {invoiceStatus.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Spend by Category</div>
          <div className="vb-chart-subtitle">Category-wise procurement cost breakdown</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={categorySpend} layout="vertical" margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={90} />
              <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
              <Bar dataKey="amount" fill="#17BC76" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Vendors by Spend */}
        <div className="vb-chart-card">
          <div className="vb-chart-title">Top Vendors by Spend</div>
          <div className="vb-chart-subtitle">Based on total purchase order value</div>
          <div style={{ marginTop: 8 }}>
            {topVendors.map((v, i) => (
              <div key={v.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 13.5 }}>{v.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13.5 }}>{fmtRupee(v.spend)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{v.pos} POs</div>
                  </div>
                </div>
                <div className="vb-progress">
                  <div className="vb-progress-bar" style={{ width: `${v.share}%`, background: i === 0 ? 'var(--primary)' : '#9CA3AF' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
