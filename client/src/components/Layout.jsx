import { Badge, Button, Container, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const roleBadgeVariant = { Admin: 'danger', Officer: 'primary', Vendor: 'success', Manager: 'warning' };

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Navbar className="px-4">
          <Container fluid className="px-0">
            <Navbar.Brand className="fw-semibold">{title}</Navbar.Brand>
            <div className="d-flex align-items-center gap-3">
              {user && (
                <Badge bg={roleBadgeVariant[user.role] || 'secondary'}>
                  {user.role}
                </Badge>
              )}
              <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </Container>
        </Navbar>
        <Container fluid className="p-4">
          {children}
        </Container>
      </main>
    </>
  );
}
