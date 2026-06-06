import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Alert, Card, Spinner } from 'react-bootstrap';
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
import { canAccessPath, dashboardPathForRole } from './sidebarItems.js';

function UnauthorizedPage() {
  return (
    <Card className="stat-card shadow-sm">
      <Card.Body>
        <h4>403 Unauthorized</h4>
        <Alert variant="warning" className="mb-0">
          Your role does not have permission to access this ERP module.
        </Alert>
      </Card.Body>
    </Card>
  );
}

function ProtectedRoute({ title, roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if ((roles && !roles.includes(user.role)) || !canAccessPath(user.role, location.pathname)) {
    return (
      <Layout title="Unauthorized">
        <UnauthorizedPage />
      </Layout>
    );
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
        {['admin', 'officer', 'vendor', 'manager'].map((rolePath) => (
          <Route
            key={rolePath}
            path={`/${rolePath}/dashboard`}
            element={(
              <ProtectedRoute title="Dashboard">
                <Dashboard />
              </ProtectedRoute>
            )}
          />
        ))}
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
            <ProtectedRoute title="New RFQ" roles={['Officer']}>
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
            <ProtectedRoute title="Add Vendor" roles={['Admin', 'Officer']}>
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
            <ProtectedRoute title="Edit Vendor" roles={['Admin', 'Officer']}>
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
            <ProtectedRoute title="Reports" roles={['Admin', 'Officer']}>
              <Reports />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute title="Dashboard">
              <DashboardRedirect />
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
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={dashboardPathForRole(user?.role)} replace />;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <Spinner animation="border" />
      </div>
    );
  }

  return <Navigate to={user ? dashboardPathForRole(user.role) : '/login'} replace />;
}
