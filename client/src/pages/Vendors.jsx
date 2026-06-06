import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Nav, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function statusBadge(status) {
  return status === 'Active' ? 'success' : 'danger';
}

export default function Vendors() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status !== 'All') params.append('status', status);

        const response = await fetch(`/api/vendors?${params.toString()}`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load vendors');
        }

        setVendors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadVendors();
  }, [search, status]);

  return (
    <>
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <Form.Control
          style={{ maxWidth: 360 }}
          placeholder="Search name, GST or category"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {['Admin', 'Officer'].includes(user?.role) && (
          <Button as={Link} to="/vendors/add" variant="primary">+ Add Vendor</Button>
        )}
      </div>

      <Nav variant="tabs" activeKey={status} onSelect={(key) => setStatus(key || 'All')} className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="All">All</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="Active">Active</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="Blocked">Blocked</Nav.Link>
        </Nav.Item>
      </Nav>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="stat-card shadow-sm">
        <Card.Body>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>GST No.</th>
                  <th>Contact No.</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-muted-small">No vendors found.</td>
                  </tr>
                )}
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>{vendor.name}</td>
                    <td>{vendor.category || '-'}</td>
                    <td>{vendor.gst_number || '-'}</td>
                    <td>{vendor.phone || '-'}</td>
                    <td>
                      <Badge bg={statusBadge(vendor.status)}>{vendor.status}</Badge>
                    </td>
                    <td>
                      <Button as={Link} to={`/vendors/${vendor.id}`} size="sm" variant="outline-primary">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
