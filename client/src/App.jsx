import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

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
          path="/dashboard"
          element={(
            <ProtectedRoute title="Dashboard">
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        {['vendors', 'rfqs', 'quotations', 'approvals', 'purchase-orders', 'invoices', 'reports', 'activity'].map((path) => (
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
