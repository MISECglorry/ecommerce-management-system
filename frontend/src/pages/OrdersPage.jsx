import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/orders');
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) setError(err?.message || 'Unable to load your orders. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  function toggleExpand(id) {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  }

  function formatDate(value) {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Loading orders...</h2>
          <p className="page-subtitle">Fetching the latest updates from your account.</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Unable to load your orders</h2>
          <p className="status-message status-error" style={{ marginTop: '0.75rem' }}>{error}</p>
        </section>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding" style={{ textAlign: 'center' }}>
          <h2 className="page-title">Your Orders</h2>
          <p className="page-subtitle">You have not placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Start Shopping
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel panel-padding">
        <h2 className="page-title">Your Orders</h2>

        <div className="stack-sm">
          {orders.map((order, index) => (
            <div key={order.id} className="panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Order #{index + 1}</div>
                  <div className="muted" style={{ fontSize: '0.95rem' }}>
                    Date: {formatDate(order.createdAt)} • Status: {order.status}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>${parseFloat(order.totalAmount || '0').toFixed(2)}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => toggleExpand(order.id)} className="btn btn-secondary">
                      {expandedOrderId === order.id ? 'Hide details' : 'View details'}
                    </button>
                  </div>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((it) => (
                      <div key={it.id} className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{it.productName}</div>
                          <div className="muted" style={{ fontSize: '0.92rem' }}>Qty: {it.quantity}</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>${parseFloat(it.price || '0').toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No items available for this order.</div>
                  )}

                  <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700 }}>Order Total</span>
                    <strong>${parseFloat(order.totalAmount || '0').toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default OrdersPage;
