import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

const categories = ['IT', 'Construction', 'Furniture', 'Office Supplies', 'IT Hardware', 'Services', 'Other'];

const emptyForm = {
  name: '',
  category: 'IT',
  gst_number: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  status: 'Active'
};

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVendor() {
      if (!isEdit) return;

      try {
        const response = await fetch(`/api/vendors/${id}`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load vendor');
        }

        setForm({
          name: data.name || '',
          category: data.category || 'IT',
          gst_number: data.gst_number || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          status: data.status || 'Active'
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadVendor();
  }, [id, isEdit]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function validate() {
    if (!form.name || !form.category || !form.gst_number || !form.phone || !form.email) {
      return 'Company name, category, GST number, phone and email are required';
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return 'Enter a valid email address';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    try {
      const response = await fetch(isEdit ? `/api/vendors/${id}` : '/api/vendors', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save vendor');
      }

      navigate(isEdit ? `/vendors/${id}` : '/vendors');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <Card className="stat-card shadow-sm">
      <Card.Body>
        <h5 className="mb-3">{isEdit ? 'Edit Vendor' : 'Add Vendor'}</h5>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Company name</Form.Label>
              <Form.Control name="name" value={form.name} onChange={updateField} required />
            </Col>
            <Col md={6}>
              <Form.Label>Category</Form.Label>
              <Form.Select name="category" value={form.category} onChange={updateField}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>GST number</Form.Label>
              <Form.Control name="gst_number" value={form.gst_number} onChange={updateField} required />
            </Col>
            <Col md={6}>
              <Form.Label>Contact person name</Form.Label>
              <Form.Control name="contact_person" value={form.contact_person} onChange={updateField} />
            </Col>
            <Col md={6}>
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" value={form.phone} onChange={updateField} required />
            </Col>
            <Col md={6}>
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" type="email" value={form.email} onChange={updateField} required />
            </Col>
            <Col md={12}>
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={3} name="address" value={form.address} onChange={updateField} />
            </Col>
            <Col md={6}>
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={form.status} onChange={updateField}>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
              </Form.Select>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-4">
            <Button type="submit" variant="primary">Save</Button>
            <Button type="button" variant="outline-secondary" onClick={() => navigate(isEdit ? `/vendors/${id}` : '/vendors')}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
