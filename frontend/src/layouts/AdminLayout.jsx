import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getToken, getUserRole } from '../services/auth';
import { isAdminRole, resolveNavigation } from '../navigation/navigation';

function AdminLayout() {
  const navigate = useNavigate();
  const role = getUserRole();
  const navigation = resolveNavigation(role, Boolean(getToken()));

  if (!isAdminRole(role)) {
    return <Navigate to="/" replace />;
  }

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #ddd', background: '#fff' }}>
        <h1>Admin Panel</h1>
        <nav style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {navigation.map((item) => {
            if (item.kind === 'button') {
              return (
                <button key={item.key} type="button" onClick={handleLogout} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                  {item.label}
                </button>
              );
            }

            return (
              <NavLink
                key={item.key}
                to={item.to}
                style={({ isActive }) => ({ textDecoration: isActive ? 'underline' : 'none', fontWeight: isActive ? 700 : 400 })}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer style={{ padding: '1rem', borderTop: '1px solid #ddd', background: '#fff' }}>
        <p>Administrative tools.</p>
      </footer>
    </div>
  );
}

export default AdminLayout;
