import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const seed = {
  _id: 'i1',
  invoice_number: 'INV-2024-001',
  po_number: 'PO-2024-001',
  invoice_date: '2024-05-16',
  due_date: '2024-06-14',
  status: 'Pending Payment',
  bill_to: { name: 'Innovate Corp Pvt Ltd', address: '14th Floor, Tech Park, Bengaluru - 560103', gstin: '29AABCI1234H1Z8', email: 'procurement@innovatecorp.com' },
  vendor: { name: 'TechCore Ltd', address: '305, Opp. ISRO, Bengaluru – 560094', gstin: '29AACT5678J1Z5', email: 'billing@techcore.com' },
  items: [
    { item_name: 'Dell Laptop 15" (Core i7)', quantity: 5, unit_price: 55000, line_total: 275000 },
    { item_name: 'HP Monitor 24" (FHD)', quantity: 5, unit_price: 18000, line_total: 90000 },
    { item_name: 'Wireless Keyboard + Mouse', quantity: 5, unit_price: 2200, line_total: 11000 },
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

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setInvoice(data?.invoice_number ? data : seed))
      .catch(() => setInvoice(seed))
      .finally(() => setLoading(false));
  }, [id]);

  async function markPaid() {
    setActing(true);
    await fetch(`/api/invoices/${id}/mark-paid`, { method: 'PATCH', credentials: 'include' }).catch(() => {});
    setInvoice(p => ({ ...p, status: 'Paid' }));
    setActing(false);
  }

  if (loading) return <div className="vb-spinner"><div className="vb-spin" /> Loading...</div>;
  if (!invoice) return null;

  const canPay = user?.role === 'Admin' || user?.role === 'Officer';

  return (
    <>
      <div className="vb-page-header no-print">
        <div>
          <div className="vb-page-title">Tax Invoice</div>
          <div className="vb-page-subtitle">{invoice.invoice_number} · PO: {invoice.po_number}</div>
        </div>
        <div className="vb-page-actions">
          <span className={`vb-badge ${invoiceStatusStyle[invoice.status] || 'vb-badge-neutral'}`} style={{ fontSize: 13, padding: '5px 12px' }}>
            {invoice.status}
          </span>
          <button className="vb-btn vb-btn-outline" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
          <button className="vb-btn vb-btn-outline">
            <Download size={15} /> Save PDF
          </button>
          
          {canPay && invoice.status !== 'Paid' && (
            <button className="vb-btn vb-btn-success" onClick={markPaid} disabled={acting}>
              <CheckCircle size={15} /> {acting ? 'Marking...' : 'Mark as Paid'}
            </button>
          )}
        </div>
      </div>

      <div className="vb-document">
        <div className="vb-doc-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>TAX INVOICE</div>
              <div style={{ opacity: 0.85, fontSize: 14 }}>
                <div style={{ fontWeight: 600 }}>{invoice.vendor.name}</div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>{invoice.vendor.address}</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>GSTIN: {invoice.vendor.gstin}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 4 }}>Invoice No <span style={{ fontWeight: 700, fontSize: 16, display: 'block', color: 'var(--primary)' }}>{invoice.invoice_number}</span></div>
              <div style={{ opacity: 0.8, fontSize: 13 }}>Date: {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</div>
              <div style={{ opacity: 0.8, fontSize: 13 }}>Due: <span style={{ fontWeight: 600 }}>{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span></div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Ref PO: {invoice.po_number}</div>
            </div>
          </div>
        </div>

        <div className="vb-doc-body">
          <div style={{ marginBottom: 24, padding: '16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Billed To</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{invoice.bill_to.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{invoice.bill_to.address}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>GSTIN: {invoice.bill_to.gstin}</div>
          </div>

          <div className="vb-table-wrap" style={{ marginBottom: 20 }}>
            <table className="vb-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Description of Goods / Services</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                    <td>{item.quantity}</td>
                    <td>{fmtRupee(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtRupee(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 300 }}>
              {[
                { label: 'Subtotal', value: fmtRupee(invoice.subtotal) },
                { label: `CGST Output (9%)`, value: fmtRupee(invoice.cgst) },
                { label: `SGST Output (9%)`, value: fmtRupee(invoice.sgst) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid var(--text-main)', marginTop: 8 }}>
                <span>Invoice Total</span>
                <span style={{ color: 'var(--primary)' }}>{fmtRupee(invoice.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vb-doc-footer">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.8 }}>
            This is a computer-generated document. No signature is required. Ensure payment within the stated due date. 
          </div>
        </div>
      </div>
    </>
  );
}
