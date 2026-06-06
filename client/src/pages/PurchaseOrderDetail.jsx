import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download, Mail, CheckCircle } from 'lucide-react';

const seed = {
  _id: 'po1',
  po_number: 'PO-2024-001',
  po_date: '2024-05-15',
  due_date: '2024-06-14',
  invoice_number: 'INV-2024-001',
  invoice_date: '2024-05-16',
  invoice_status: 'Pending Payment',
  buyer: { name: 'Innovate Corp Pvt Ltd', address: '14th Floor, Tech Park, Bengaluru - 560103', gst: '29AABCI1234H1Z8', email: 'procurement@innovatecorp.com', phone: '+91 80 6789 0123' },
  vendor: { name: 'TechCore Ltd', address: '305, Opp. ISRO, Bengaluru – 560094', gst: '29AACT5678J1Z5', email: 'billing@techcore.com', phone: '+91 80 4567 8901' },
  items: [
    { name: 'Dell Laptop 15" (Core i7)', qty: 5, unit_price: 55000, tax: 18, total: 275000 },
    { name: 'HP Monitor 24" (FHD)', qty: 5, unit_price: 18000, tax: 18, total: 90000 },
    { name: 'Wireless Keyboard + Mouse', qty: 5, unit_price: 2200, tax: 18, total: 11000 },
  ],
  subtotal: 376000, cgst: 33840, sgst: 33840, grand_total: 443680,
};

const invoiceStatusStyle = {
  'Pending Payment': 'vb-badge-warning',
  'Paid': 'vb-badge-success',
  'Overdue': 'vb-badge-danger',
};

function fmtRupee(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`/api/purchase-orders/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setPO(data?.po_number ? data : seed))
      .catch(() => setPO(seed))
      .finally(() => setLoading(false));
  }, [id]);

  async function markAsPaid() {
    setMarking(true);
    await fetch(`/api/invoices/${po._id}/pay`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setPO(p => ({ ...p, invoice_status: 'Paid' }));
    setMarking(false);
  }

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading...</div>;
  if (!po) return null;

  return (
    <>
      <div className="vb-page-header vb-page-header no-print">
        <div>
          <div className="vb-page-title">Purchase Order & Invoice</div>
          <div className="vb-page-subtitle">{po.po_number} · {po.invoice_number}</div>
        </div>
        <div className="vb-page-actions">
          <span className={`vb-badge ${invoiceStatusStyle[po.invoice_status] || 'vb-badge-neutral'}`} style={{ fontSize: 13, padding: '5px 12px' }}>
            {po.invoice_status}
          </span>
          <button className="vb-btn vb-btn-outline" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
          <button className="vb-btn vb-btn-outline">
            <Download size={15} /> Download PDF
          </button>
          <button className="vb-btn vb-btn-outline">
            <Mail size={15} /> Email Invoice
          </button>
          {po.invoice_status !== 'Paid' && (
            <button className="vb-btn vb-btn-success" onClick={markAsPaid} disabled={marking}>
              <CheckCircle size={15} /> {marking ? 'Marking...' : 'Mark as Paid'}
            </button>
          )}
        </div>
      </div>

      <div className="vb-document">
        {/* Doc header */}
        <div className="vb-doc-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>PURCHASE ORDER</div>
              <div style={{ opacity: 0.85, fontSize: 14 }}>
                <div>{po.buyer.name}</div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>{po.buyer.address}</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>GST: {po.buyer.gst}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, opacity: 0.9 }}>🔗 VendorBridge</div>
              <div style={{ opacity: 0.65, fontSize: 12, marginTop: 4 }}>Procurement ERP</div>
              <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', display: 'inline-block' }}>
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>PO Number</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{po.po_number}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="vb-doc-body">
          {/* Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 8 }}>Bill To</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{po.vendor.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{po.vendor.address}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>GST: {po.vendor.gst}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{po.vendor.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <table style={{ marginLeft: 'auto', fontSize: 13 }}>
                <tbody>
                  {[
                    ['PO Date', new Date(po.po_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ['Invoice No.', po.invoice_number],
                    ['Invoice Date', new Date(po.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ['Due Date', new Date(po.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ['Payment Status', po.invoice_status],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: 'var(--text-muted)', paddingRight: 16, paddingBottom: 5 }}>{k}</td>
                      <td style={{ fontWeight: 600, paddingBottom: 5 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="vb-divider" />

          {/* Items table */}
          <div className="vb-table-wrap" style={{ marginBottom: 20 }}>
            <table className="vb-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Item Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Tax %</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(po.items || seed.items).map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{fmtRupee(item.unit_price)}</td>
                    <td>{item.tax}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtRupee(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 280 }}>
              {[
                { label: 'Subtotal', value: fmtRupee(po.subtotal) },
                { label: `CGST (9%)`, value: fmtRupee(po.cgst) },
                { label: `SGST (9%)`, value: fmtRupee(po.sgst) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid var(--text-main)', marginTop: 8 }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary)' }}>{fmtRupee(po.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vb-doc-footer">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-main)' }}>Terms & Conditions</div>
              <div>All items subject to standard terms. Payment due within 30 days. GST invoice as per regulations.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>Authorized Signatory</div>
              <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                {po.buyer.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
