import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Activity as ActivityIcon, ClipboardList, CheckSquare, Receipt, Building2, Search, Filter } from 'lucide-react';

const moduleIcons = {
  RFQ: ClipboardList,
  Approval: CheckSquare,
  Invoice: Receipt,
  Vendor: Building2,
  PO: ActivityIcon,
};

const moduleColors = {
  RFQ: { color: '#2563EB', bg: '#EFF6FF' },
  Approval: { color: '#16A34A', bg: '#F0FDF4' },
  Invoice: { color: '#D97706', bg: '#FFFBEB' },
  Vendor: { color: '#714B67', bg: '#F3EEF2' },
  PO: { color: '#7C3AED', bg: '#F5F3FF' },
};

const seedLogs = [
  { _id: 'l1', module: 'RFQ', action: 'RFQ Published', description: 'RFQ-2024-001 published and sent to 4 vendors for quotation submission.', user: 'Ravi Kumar', role: 'Officer', created_at: '2024-05-10T09:00:00Z' },
  { _id: 'l2', module: 'Vendor', action: 'Vendor Registered', description: 'TechCore Ltd registered and activated as a vendor in the system.', user: 'System Admin', role: 'Admin', created_at: '2024-05-09T15:30:00Z' },
  { _id: 'l3', module: 'RFQ', action: 'Quotation Submitted', description: 'TechCore Ltd submitted quotation for RFQ-2024-001 (₹4,43,680).', user: 'TechCore Ltd', role: 'Vendor', created_at: '2024-05-11T11:20:00Z' },
  { _id: 'l4', module: 'RFQ', action: 'Quotation Submitted', description: 'Globalmart Traders submitted quotation for RFQ-2024-001 (₹4,18,900).', user: 'Globalmart Traders', role: 'Vendor', created_at: '2024-05-11T14:00:00Z' },
  { _id: 'l5', module: 'RFQ', action: 'Quotation Selected', description: 'TechCore Ltd selected as preferred vendor for RFQ-2024-001.', user: 'Ravi Kumar', role: 'Officer', created_at: '2024-05-12T10:00:00Z' },
  { _id: 'l6', module: 'Approval', action: 'Approval Requested', description: 'Approval submitted for RFQ-2024-001 — TechCore Ltd (₹4,43,680).', user: 'Ravi Kumar', role: 'Officer', created_at: '2024-05-12T10:05:00Z' },
  { _id: 'l7', module: 'Approval', action: 'L1 Approved', description: 'Procurement Head Meera Singh approved the request.', user: 'Meera Singh', role: 'Manager', created_at: '2024-05-12T14:00:00Z' },
  { _id: 'l8', module: 'Approval', action: 'Fully Approved', description: 'Finance Manager Arjun Mehta approved. PO generation triggered.', user: 'Arjun Mehta', role: 'Manager', created_at: '2024-05-13T10:00:00Z' },
  { _id: 'l9', module: 'PO', action: 'PO Generated', description: 'PO-2024-001 generated for TechCore Ltd worth ₹4,43,680.', user: 'System', role: 'System', created_at: '2024-05-13T10:02:00Z' },
  { _id: 'l10', module: 'Invoice', action: 'Invoice Created', description: 'INV-2024-001 created against PO-2024-001. Due in 30 days.', user: 'System', role: 'System', created_at: '2024-05-15T09:00:00Z' },
  { _id: 'l11', module: 'Invoice', action: 'Invoice Paid', description: 'INV-2024-001 payment received and marked as Paid.', user: 'Finance Dept', role: 'Admin', created_at: '2024-06-01T16:00:00Z' },
];

const moduleTabs = ['All', 'RFQ', 'Approval', 'Invoice', 'Vendor', 'PO'];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Activity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/activity', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs(seedLogs))
      .finally(() => setLoading(false));
  }, []);

  const display = logs.length ? logs : seedLogs;
  const filtered = display.filter(l => {
    const matchModule = activeModule === 'All' || l.module === activeModule;
    const q = search.toLowerCase();
    const matchSearch = !q || l.action?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.user?.toLowerCase().includes(q);
    return matchModule && matchSearch;
  });

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Activity & Audit Logs</div>
          <div className="vb-page-subtitle">Immutable procurement audit trail — read only</div>
        </div>
        <div className="vb-page-actions">
          <span className="vb-badge vb-badge-neutral" style={{ fontSize: 12.5, padding: '4px 10px' }}>
            🔒 Audit logs are immutable
          </span>
        </div>
      </div>

      <div className="vb-card vb-card-body">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div className="vb-filter-tabs">
            {moduleTabs.map(tab => (
              <button key={tab} className={`vb-filter-tab${activeModule === tab ? ' active' : ''}`} onClick={() => setActiveModule(tab)}>
                {tab}
                <span style={{ marginLeft: 4, padding: '0 5px', background: activeModule === tab ? 'var(--primary-light)' : 'transparent', borderRadius: 10, fontSize: 11, color: activeModule === tab ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {tab === 'All' ? display.length : display.filter(l => l.module === tab).length}
                </span>
              </button>
            ))}
          </div>
          <div className="vb-search">
            <Search size={15} />
            <input placeholder="Search activity, user..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="vb-spinner"><div className="vb-spin" /> Loading activity...</div>
        ) : filtered.length === 0 ? (
          <div className="vb-empty">
            <div className="vb-empty-icon"><ActivityIcon size={24} /></div>
            <div className="vb-empty-title">No activity found</div>
          </div>
        ) : (
          <div className="vb-timeline">
            {filtered.map((log, i) => {
              const Icon = moduleIcons[log.module] || ActivityIcon;
              const style = moduleColors[log.module] || { color: 'var(--text-muted)', bg: 'var(--bg)' };
              return (
                <div key={log._id} className="vb-timeline-item">
                  <div className="vb-timeline-dot info" style={{ background: style.color }} />
                  <div className="vb-timeline-line" />
                  <div className="vb-timeline-content">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="vb-timeline-title">{log.action}</div>
                          <div className="vb-timeline-desc">{log.description}</div>
                          <div className="vb-timeline-meta">
                            <span style={{ background: style.bg, color: style.color, padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                              {log.module}
                            </span>
                            <span>👤 {log.user}</span>
                            <span style={{ fontSize: 11 }}>{log.role}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>
                        <div>{timeAgo(log.created_at)}</div>
                        <div style={{ marginTop: 3, fontSize: 11 }}>{formatTime(log.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
