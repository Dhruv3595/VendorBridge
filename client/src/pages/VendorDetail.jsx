import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadVendor() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load vendor');
      }

      setVendor(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendor();
  }, [id]);

  async function toggleStatus() {
    try {
      const response = await fetch(`/api/vendors/${id}/status`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not update status');
      }

      setVendor(data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (!vendor) {
    return <Alert variant="danger">{error || 'Vendor not found'}</Alert>;
  }

  return (
    <Card className="stat-card shadow-sm">
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex flex-wrap justify-content-between gap-2 mb-4">
          <div>
            <h4 className="mb-1">{vendor.name}</h4>
            <Badge bg={vendor.status === 'Active' ? 'success' : 'danger'}>{vendor.status}</Badge>
          </div>
          <div className="d-flex gap-2">
            <Button as={Link} to={`/vendors/${id}/edit`} variant="outline-primary">Edit</Button>
            <Button variant={vendor.status === 'Active' ? 'outline-danger' : 'outline-success'} onClick={toggleStatus}>
              {vendor.status === 'Active' ? 'Block' : 'Unblock'}
            </Button>
          </div>
        </div>

        <Row className="g-3">
          <Col md={6}>
            <div className="text-muted-small">Category</div>
            <div>{vendor.category || '-'}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted-small">GST No.</div>
            <div>{vendor.gst_number || '-'}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted-small">Contact Person</div>
            <div>{vendor.contact_person || '-'}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted-small">Phone</div>
            <div>{vendor.phone || '-'}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted-small">Email</div>
            <div>{vendor.email || '-'}</div>
          </Col>
          <Col md={12}>
            <div className="text-muted-small">Address</div>
            <div>{vendor.address || '-'}</div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
