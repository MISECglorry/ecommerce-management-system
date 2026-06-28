import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { clearToken, getToken, getUserName, getUserRole } from '../services/auth';
import { isAdminRole, resolveNavigation } from '../navigation/navigation';

function CustomerLayout() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const role = getUserRole();
  const isSignedIn = Boolean(getToken());
  const userName = getUserName();
  const navigation = resolveNavigation(role, isSignedIn);

  useEffect(() => {
    let isMounted = true;

    async function loadCartCount() {
      if (!getToken()) {
        setCartCount(0);
        return;
      }

      try {
        const cartItems = await api.get('/cart');
        const count = Array.isArray(cartItems)
          ? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          : 0;

        if (isMounted) {
          setCartCount(count);
        }
      } catch {
        if (isMounted) {
          setCartCount(0);
        }
      }
    }

    loadCartCount();

    function handleCartUpdated() {
      loadCartCount();
    }

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, []);

  if (isAdminRole(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #ddd', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <img src="/favicon.svg" alt="iStore logo" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
          <h1 style={{ margin: 0 }}>iStore</h1>
        </div>
        {isSignedIn && userName ? <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>Welcome, {userName}</p> : null}
        <nav style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {navigation.map((item) => {
            if (item.kind === 'button') {
              return (
                <button key={item.key} type="button" onClick={handleLogout} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                  {item.label}
                </button>
              );
            }

            const isCartLink = item.key === 'cart';
            return (
              <NavLink
                key={item.key}
                to={item.to}
                style={({ isActive }) => ({ textDecoration: isActive ? 'underline' : 'none', fontWeight: isActive ? 700 : 400 })}
              >
                {isCartLink ? `${item.label}${cartCount ? ` (${cartCount})` : ''}` : item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer style={{ padding: '1rem', borderTop: '1px solid #ddd', background: '#fff' }}>
        <p>Customer storefront experience.</p>
      </footer>
    </div>
  );
}

export default CustomerLayout;
