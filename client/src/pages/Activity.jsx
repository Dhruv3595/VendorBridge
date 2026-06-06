import { useEffect, useState } from 'react';
import { Alert, Card, Nav, Spinner } from 'react-bootstrap';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'rfq', label: 'RFQ' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'vendors', label: 'Vendors' }
];

function iconText(action) {
  const first = (action || 'A').charAt(0).toUpperCase();
  return first || 'A';
}

function timeText(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function Activity() {
  const [filter, setFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadActivity() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/activity?filter=${filter}`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load activity');
        }

        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [filter]);

  return (
    <>
      <Nav variant="tabs" activeKey={filter} onSelect={(key) => setFilter(key || 'all')} className="mb-3">
        {tabs.map((tab) => (
          <Nav.Item key={tab.key}>
            <Nav.Link eventKey={tab.key}>{tab.label}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="stat-card shadow-sm">
        <Card.Body>
          {loading ? (
            <Spinner animation="border" />
          ) : logs.length === 0 ? (
            <p className="text-muted-small mb-0">No activity found.</p>
          ) : (
            <div>
              {logs.map((log) => (
                <div key={log.id} className="d-flex gap-3 pb-3 mb-3 border-bottom">
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'var(--accent-light)',
                      color: 'var(--accent-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    {iconText(log.action)}
                  </div>
                  <div>
                    <div className="fw-semibold">{log.action}</div>
                    <div className="text-muted-small">{log.description || '-'}</div>
                    <div className="text-muted-small mt-1">{timeText(log.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
