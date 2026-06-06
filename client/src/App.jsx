import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Vendors from './pages/Vendors.jsx';
import VendorForm from './pages/VendorForm.jsx';
import VendorDetail from './pages/VendorDetail.jsx';
import RFQs from './pages/RFQs.jsx';
import RFQForm from './pages/RFQForm.jsx';
import QuotationSubmit from './pages/QuotationSubmit.jsx';
import QuotationCompare from './pages/QuotationCompare.jsx';
import Approvals from './pages/Approvals.jsx';
import ApprovalDetail from './pages/ApprovalDetail.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail.jsx';
import Invoices from './pages/Invoices.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import Activity from './pages/Activity.jsx';
import Reports from './pages/Reports.jsx';

function ProtectedRoute({ title, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout title={title}>{children}</Layout>;
}

function PlaceholderPage({ title }) {
  return (
    <div>
      <h4>{title}</h4>
      <p className="text-muted-small">This module will be added in the next phase.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/rfqs"
          element={(
            <ProtectedRoute title="RFQs">
              <RFQs />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/rfqs/new"
          element={(
            <ProtectedRoute title="New RFQ">
              <RFQForm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/rfqs/:rfqId/quotations/compare"
          element={(
            <ProtectedRoute title="Compare Quotations">
              <QuotationCompare />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/rfqs/:rfqId/quotations/submit"
          element={(
            <ProtectedRoute title="Submit Quotation">
              <QuotationSubmit />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/approvals"
          element={(
            <ProtectedRoute title="Approvals">
              <Approvals />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/approvals/:id"
          element={(
            <ProtectedRoute title="Approval Detail">
              <ApprovalDetail />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/vendors"
          element={(
            <ProtectedRoute title="Vendors">
              <Vendors />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/vendors/add"
          element={(
            <ProtectedRoute title="Add Vendor">
              <VendorForm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/vendors/:id"
          element={(
            <ProtectedRoute title="Vendor Details">
              <VendorDetail />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/vendors/:id/edit"
          element={(
            <ProtectedRoute title="Edit Vendor">
              <VendorForm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/purchase-orders"
          element={(
            <ProtectedRoute title="Purchase Orders">
              <PurchaseOrders />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/purchase-orders/:id"
          element={(
            <ProtectedRoute title="Purchase Order Detail">
              <PurchaseOrderDetail />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/invoices"
          element={(
            <ProtectedRoute title="Invoices">
              <Invoices />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/invoices/:id"
          element={(
            <ProtectedRoute title="Invoice Detail">
              <InvoiceDetail />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/activity"
          element={(
            <ProtectedRoute title="Activity">
              <Activity />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/reports"
          element={(
            <ProtectedRoute title="Reports">
              <Reports />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute title="Dashboard">
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        {['quotations'].map((path) => (
          <Route
            key={path}
            path={`/${path}`}
            element={(
              <ProtectedRoute title={path.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')}>
                <PlaceholderPage title={path.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')} />
              </ProtectedRoute>
            )}
          />
        ))}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
