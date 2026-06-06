import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const categories = ['IT', 'Construction', 'Furniture', 'Office Supplies', 'IT Hardware', 'Services', 'Other'];
const units = ['pcs', 'kg', 'box', 'meter', 'set'];

const emptyForm = {
  title: '',
  category: 'IT',
  deadline: '',
  description: '',
  items: [{ item_name: '', quantity: 1, unit: 'pcs' }],
  vendorIds: []
};

export default function RFQForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVendors() {
      try {
        const response = await fetch('/api/vendors?status=Active', {
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
        setLoadingVendors(false);
      }
    }

    loadVendors();
  }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function updateItem(index, field, value) {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { item_name: '', quantity: 1, unit: 'pcs' }]
    });
  }

  function removeItem(index) {
    const items = form.items.filter((item, itemIndex) => itemIndex !== index);
    setForm({ ...form, items: items.length ? items : [{ item_name: '', quantity: 1, unit: 'pcs' }] });
  }

  function toggleVendor(vendorId) {
    const vendorIds = form.vendorIds.includes(vendorId)
      ? form.vendorIds.filter((id) => id !== vendorId)
      : [...form.vendorIds, vendorId];

    setForm({ ...form, vendorIds });
  }

  function validate() {
    if (!form.title.trim()) {
      return 'RFQ title is required';
    }

    if (!form.deadline || new Date(form.deadline) <= new Date()) {
      return 'Deadline must be in the future';
    }

    const hasItem = form.items.some((item) => item.item_name.trim() && Number(item.quantity) > 0);
    if (!hasItem) {
      return 'Add at least one line item';
    }

    return '';
  }

  async function submitRfq(status) {
    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    try {
      const cleanedItems = form.items
        .filter((item) => item.item_name.trim())
        .map((item) => ({
          item_name: item.item_name,
          quantity: Number(item.quantity),
          unit: item.unit
        }));

      const targetStatus = status === 'Published' ? 'Draft' : status;
      const response = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, items: cleanedItems, status: targetStatus })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save RFQ');
      }

      if (status === 'Published') {
        const publishResponse = await fetch(`/api/rfqs/${data.id}/publish`, {
          method: 'POST',
          credentials: 'include'
        });
        const publishData = await publishResponse.json();

        if (!publishResponse.ok) {
          throw new Error(publishData.message || 'RFQ saved but could not be published');
        }
      }

      navigate('/rfqs');
    } catch (err) {
      setError(err.message);
    }
  }

  function goNext() {
    if (currentStep === 1 && !form.title.trim()) {
      setError('RFQ title is required');
      return;
    }

    setError('');
    setCurrentStep(currentStep + 1);
  }

  return (
    <Card className="stat-card shadow-sm">
      <Card.Body>
        <div className="d-flex gap-2 mb-4">
          {[1, 2, 3].map((step) => (
            <Badge key={step} bg={currentStep === step ? 'primary' : 'secondary'}>
              Step {step}
            </Badge>
          ))}
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {currentStep === 1 && (
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>RFQ Title</Form.Label>
              <Form.Control name="title" value={form.title} onChange={updateField} />
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
              <Form.Label>Deadline</Form.Label>
              <Form.Control type="date" name="deadline" value={form.deadline} onChange={updateField} />
            </Col>
            <Col md={12}>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={4} name="description" value={form.description} onChange={updateField} />
            </Col>
          </Row>
        )}

        {currentStep === 2 && (
          <>
            {form.items.map((item, index) => (
              <Row className="g-2 align-items-end mb-2" key={index}>
                <Col md={5}>
                  <Form.Label>Item name</Form.Label>
                  <Form.Control value={item.item_name} onChange={(event) => updateItem(index, 'item_name', event.target.value)} />
                </Col>
                <Col md={3}>
                  <Form.Label>Qty</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Unit</Form.Label>
                  <Form.Select value={item.unit} onChange={(event) => updateItem(index, 'unit', event.target.value)}>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="outline-danger" onClick={() => removeItem(index)}>Remove</Button>
                </Col>
              </Row>
            ))}
            <Button type="button" variant="outline-primary" onClick={addItem}>+ Add Line Item</Button>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h6>Assign Vendors</h6>
            {loadingVendors ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Row className="g-2 mb-3">
                {vendors.map((vendor) => (
                  <Col md={6} key={vendor.id}>
                    <Form.Check
                      type="checkbox"
                      label={`${vendor.name} (${vendor.category || 'No category'})`}
                      checked={form.vendorIds.includes(vendor.id)}
                      onChange={() => toggleVendor(vendor.id)}
                    />
                  </Col>
                ))}
              </Row>
            )}

            <Form.Label>Attachments</Form.Label>
            <Form.Control type="file" />
          </>
        )}

        <div className="d-flex flex-wrap gap-2 mt-4">
          {currentStep > 1 && (
            <Button type="button" variant="outline-secondary" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
          )}
          {currentStep < 3 && (
            <Button type="button" variant="primary" onClick={goNext}>
              Next
            </Button>
          )}
          {currentStep === 3 && (
            <>
              <Button type="button" variant="primary" onClick={() => submitRfq('Published')}>
                Save & Send to Vendors
              </Button>
              <Button type="button" variant="outline-secondary" onClick={() => submitRfq('Draft')}>
                Save as Draft
              </Button>
            </>
          )}
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/rfqs')}>
            Cancel
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
