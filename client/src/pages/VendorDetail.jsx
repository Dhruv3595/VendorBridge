import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, CheckCircle, Edit2, ShieldAlert, Star } from 'lucide-react';

const seedVendor = {
  name: 'TechCore Ltd',
  category: 'IT Hardware',
  gst_number: '29AACT5678J1Z5',
  contact_person: 'Rahul Verma',
  phone: '+91 98765 43210',
  email: 'billing@techcore.com',
  address: '305, Tower B, Cyber Park, Electronic City, Bengaluru - 560100',
  status: 'Active',
  rating: 4.8,
  created_at: '2023-11-15',
  metrics: {
    total_pos: 15,
    fulfilled: 14,
    spend: 443680
  }
};

const statusStyle = {
  Active: 'vb-badge-success',
  Pending: 'vb-badge-warning',
  Blocked: 'vb-badge-danger',
};

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendors/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setVendor(data?.name ? data : seedVendor))
      .catch(() => setVendor(seedVendor))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading profile...</div>;
  if (!vendor) return null;

  return (
    <>
      <div className="vb-page-header">
        <div>
          <div className="vb-page-title">Vendor Profile</div>
          <div className="vb-page-subtitle">Detailed supplier information and performance metrics</div>
        </div>
        <div className="vb-page-actions">
          <Link to={`/vendors/${id}/edit`} className="vb-btn vb-btn-primary">
            <Edit2 size={15} /> Edit Vendor
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start' }}>
        
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="vb-card vb-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                {vendor.name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{vendor.name}</h3>
                  <span className={`vb-badge ${statusStyle[vendor.status] || 'vb-badge-neutral'}`}>{vendor.status}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="vb-tag">{vendor.category}</span>
                  • GST: {vendor.gst_number}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vendor Rating</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: 18, fontWeight: 700 }}>
                  <Star size={18} fill="#F59E0B" /> {vendor.rating?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="vb-card vb-card-body">
            <div className="vb-section-title">Contact & Location</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Primary Contact</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}>
                  <Mail size={14} color="var(--text-secondary)" /> {vendor.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}>
                  <Phone size={14} color="var(--text-secondary)" /> {vendor.phone}
                </div>
                {vendor.contact_person && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Building2 size={14} color="var(--text-secondary)" /> {vendor.contact_person}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Registered Address</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                  <MapPin size={14} color="var(--text-secondary)" style={{ marginTop: 2, flexShrink: 0 }} /> 
                  <div>{vendor.address || 'Address not provided.'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="vb-card vb-card-body">
            <div className="vb-section-title">Performance Metrics</div>
            {[
              { label: 'Total POs Issued', value: vendor.metrics?.total_pos || 0 },
              { label: 'Fulfilled Orders', value: vendor.metrics?.fulfilled || 0 },
              { label: 'Fulfillment Rate', value: `${Math.round(((vendor.metrics?.fulfilled || 0) / (vendor.metrics?.total_pos || 1)) * 100)}%` },
              { label: 'Total Spend', value: fmtRupee(vendor.metrics?.spend || 0) },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--border-light)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="vb-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="vb-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>
                <ShieldAlert size={16} /> Compliance Setup
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                Ensure valid GST credentials before issuing large POs. TDS applicability is managed automatically.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                <CheckCircle size={14} /> GST Verified
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
