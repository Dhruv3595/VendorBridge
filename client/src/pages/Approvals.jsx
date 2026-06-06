import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Card, Spinner, Table } from 'react-bootstrap';

// Map status to Bootstrap badge variant
function statusVariant(status) {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'danger';
  return 'warning';
}

export default function Approvals() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApprovals() {
      try {
        const res = await fetch('/api/approvals', { credentials: 'include' });
        if (!res.ok) throw new Error('Could not load approvals');
        setApprovals(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadApprovals();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      {approvals.length === 0 ? (
        <Card className="text-center p-5" style={{ borderColor: 'var(--border)' }}>
          <p className="text-muted-small mb-0">No approvals found.</p>
        </Card>
      ) : (
        <Table hover responsive style={{ background: 'var(--surface)' }}>
          <thead style={{ background: 'var(--primary-light)' }}>
            <tr>
              <th>#</th>
              <th>RFQ</th>
              <th>Vendor</th>
              <th>Level</th>
              <th>Approver</th>
              <th>Status</th>
              <th>Acted At</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((a) => (
              <tr
                key={a.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/approvals/${a.id}`)}
              >
                <td>{a.id}</td>
                <td>{a.rfq_title}</td>
                <td>{a.vendor_name}</td>
                <td>L{a.level}</td>
                <td>{a.approver_name || '—'}</td>
                <td>
                  <Badge bg={statusVariant(a.status)}>{a.status}</Badge>
                </td>
                <td className="text-muted-small">
                  {a.acted_at ? new Date(a.acted_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
