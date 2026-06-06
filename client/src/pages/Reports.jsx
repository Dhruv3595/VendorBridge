import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, TrendingUp, Building2, ShoppingBag, AlertTriangle } from 'lucide-react';

function fmtRupee(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${Number(v || 0).toFixed(0)}`;
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = ['#714B67', '#17BC76', '#2563EB', '#F59E0B', '#DC2626', '#8B5CF6'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [monthlySpend, setMonthlySpend] = useState([]);
  const [categorySpend, setCategorySpend] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build the last 12 months for the selector
  const now = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
  });
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[monthOptions.length - 1].value);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/reports/stats', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/reports/monthly-spend', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/reports/spend-by-category', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/reports/top-vendors', { credentials: 'include' }).then(r => r.json()),
    ]).then(([s, ms, cs, tv]) => {
      setStats(s);
      setMonthlySpend(Array.isArray(ms) ? ms : []);
      setCategorySpend(Array.isArray(cs) ? cs : []);
      setTopVendors(Array.isArray(tv) ? tv : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter monthly data by selected month (show up to that month in 6-month window)
  const filteredMonthly = (() => {
    if (!monthlySpend.length) return [];
    const idx = monthlySpend.findIndex(m => {
      // m.month is like "Jan 2026"
      const parts = m.month.split(' ');
      const mIdx = MONTH_NAMES.indexOf(parts[0]);
      const yr = parseInt(parts[1]);
      return `${yr}-${String(mIdx + 1).padStart(2, '0')}` === selectedMonth;
    });
    if (idx === -1) return monthlySpend;
    return monthlySpend.slice(Math.max(0, idx - 5), idx + 1);
  })();

  // Invoice status from stats
  const invoiceStatus = stats ? [
    { name: 'Paid', value: stats.total_pos - stats.overdue_invoices, color: '#16A34A' },
    { name: 'Pending', value: Math.max(0, stats.total_pos - stats.overdue_invoices - 1), color: '#F59E0B' },
    { name: 'Overdue', value: stats.overdue_invoices, color: '#DC2626' },
  ] : [];

  async function handleExport() {
    try {
      const res = await fetch('/api/reports/export', { credentials: 'include' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'purchase-orders.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed');
    }
  }

  const maxVendorSpend = topVendors.length ? Math.max(...topVendors.map(v => Number(v.total_value || 0))) : 1;

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Reports & Analytics</div>
          <div className="vb-page-subtitle">Procurement insights and performance metrics</div>
        </div>
        <div className="vb-page-actions">
          <select
            className="vb-select"
            style={{ width: 160, height: 36 }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button className="vb-btn vb-btn-outline" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top cards */}
      <div className="vb-grid-4 vb-mb-6">
        <StatCard
          icon={TrendingUp} label="Total Spend (YTD)"
          value={loading ? '...' : fmtRupee(stats?.total_invoice_amount || 0)}
          color="#714B67" bg="var(--primary-light)"
          sub={stats ? `${stats.total_pos} purchase orders` : ''}
        />
        <StatCard
          icon={Building2} label="Active Vendors"
          value={loading ? '...' : (stats?.active_vendors ?? 0)}
          color="#16A34A" bg="#F0FDF4"
          sub={stats ? `${stats.total_vendors} total vendors` : ''}
        />
        <StatCard
          icon={ShoppingBag} label="PO Fulfillment %"
          value={loading ? '...' : `${stats?.po_fulfillment_percent ?? 0}%`}
          color="#2563EB" bg="#EFF6FF"
          sub={stats ? `${stats.total_rfqs} total RFQs` : ''}
        />
        <StatCard
          icon={AlertTriangle} label="Overdue Invoices"
          value={loading ? '...' : (stats?.overdue_invoices ?? 0)}
          color="#DC2626" bg="#FEF2F2"
          sub="Past due date"
        />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Monthly Spend Trend</div>
          <div className="vb-chart-subtitle">
            Procurement expenditure — showing months up to {monthOptions.find(m => m.value === selectedMonth)?.label}
          </div>
          {loading ? (
            <div className="vb-spinner" style={{ height: 230 }}><div className="vb-spin" /> Loading...</div>
          ) : filteredMonthly.length === 0 ? (
            <div className="vb-empty" style={{ height: 230 }}>
              <div className="vb-empty-title">No spend data</div>
              <div className="vb-empty-desc">No invoices recorded for this period</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={filteredMonthly} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
                <Bar dataKey="total" fill="#714B67" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="vb-chart-card">
          <div className="vb-chart-title">Invoice Status</div>
          <div className="vb-chart-subtitle">Payment health overview</div>
          {loading ? (
            <div className="vb-spinner" style={{ height: 160 }}><div className="vb-spin" /></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={invoiceStatus.filter(s => s.value > 0)} innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {invoiceStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v}`, name]} />
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
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="vb-chart-card">
          <div className="vb-chart-title">Spend by Category</div>
          <div className="vb-chart-subtitle">Category-wise procurement cost breakdown</div>
          {loading ? (
            <div className="vb-spinner" style={{ height: 210 }}><div className="vb-spin" /></div>
          ) : categorySpend.length === 0 ? (
            <div className="vb-empty" style={{ height: 210 }}>
              <div className="vb-empty-title">No category data</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={categorySpend} layout="vertical" margin={{ right: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtRupee} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={100} />
                <Tooltip formatter={v => [fmtRupee(v), 'Spend']} />
                <Bar dataKey="total" fill="#17BC76" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="vb-chart-card">
          <div className="vb-chart-title">Top Vendors by Spend</div>
          <div className="vb-chart-subtitle">Based on total purchase order value</div>
          {loading ? (
            <div className="vb-spinner" style={{ height: 210 }}><div className="vb-spin" /></div>
          ) : topVendors.length === 0 ? (
            <div className="vb-empty" style={{ height: 210 }}>
              <div className="vb-empty-title">No vendor data</div>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {topVendors.map((v, i) => {
                const spend = Number(v.total_value || 0);
                const pct = maxVendorSpend > 0 ? (spend / maxVendorSpend) * 100 : 0;
                return (
                  <div key={v.id || v.vendor_name} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                          {i + 1}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: 13.5 }}>{v.vendor_name || 'Unknown'}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13.5 }}>{fmtRupee(spend)}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{v.po_count} POs</div>
                      </div>
                    </div>
                    <div className="vb-progress">
                      <div className="vb-progress-bar" style={{ width: `${pct}%`, background: i === 0 ? 'var(--primary)' : '#9CA3AF' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
