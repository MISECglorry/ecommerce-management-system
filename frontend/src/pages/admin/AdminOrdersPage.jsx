import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';

const STATUS_FILTERS = ['All', 'CREATED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

function getStatusBadgeStyle(status) {
  const normalized = String(status || '').toUpperCase();

  switch (normalized) {
    case 'CREATED':
      return { background: '#fef3c7', color: '#92400e' };
    case 'PROCESSING':
      return { background: '#dbeafe', color: '#1d4ed8' };
    case 'COMPLETED':
      return { background: '#dcfce7', color: '#166534' };
    case 'CANCELLED':
      return { background: '#fee2e2', color: '#b91c1c' };
    default:
      return { background: '#f3f4f6', color: '#374151' };
  }
}

function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      setError('');

      try {
        const data = await api.get('/orders/all');
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load orders right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter = filter === 'All' || String(order.status || '').toUpperCase() === filter.toUpperCase();
      const matchesSearch = !normalizedSearch || String(order.id).includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  async function handleTransition(orderId, action) {
    setBusyOrderId(orderId);
    setActionError('');
    setActionMessage('');

    try {
      const path = action === 'process'
        ? `/orders/${orderId}/process`
        : action === 'complete'
          ? `/orders/${orderId}/complete`
          : `/orders/${orderId}/cancel`;

      await api.put(path, {});
      setActionMessage(`Order ${orderId} updated successfully.`);
      const refreshed = await api.get('/orders/all');
      setOrders(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setActionError(err?.message || 'Unable to update the order.');
    } finally {
      setBusyOrderId(null);
    }
  }

  function renderActions(order) {
    const status = String(order.status || '').toUpperCase();

    if (status === 'COMPLETED') {
      return <span style={{ color: '#166534', fontWeight: 600 }}>Completed ✓</span>;
    }

    if (status === 'CANCELLED') {
      return <span style={{ color: '#b91c1c', fontWeight: 600 }}>Cancelled ✖</span>;
    }

    const isBusy = busyOrderId === order.id;

    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {status === 'CREATED' ? (
          <>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'process')} style={buttonStyle(isBusy)}>
              {isBusy ? 'Working...' : 'Start Processing'}
            </button>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'cancel')} style={secondaryButtonStyle(isBusy)}>
              {isBusy ? 'Working...' : 'Cancel'}
            </button>
          </>
        ) : null}

        {status === 'PROCESSING' ? (
          <>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'complete')} style={buttonStyle(isBusy)}>
              {isBusy ? 'Working...' : 'Complete'}
            </button>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'cancel')} style={secondaryButtonStyle(isBusy)}>
              {isBusy ? 'Working...' : 'Cancel'}
            </button>
          </>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '1.25rem' }}>Loading orders...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Admin Orders</h2>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <section style={{ padding: '1.25rem', background: '#fff', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Admin Orders</h2>
        <p style={{ color: '#4b5563', marginTop: '-0.25rem' }}>Manage customer orders and update their lifecycle.</p>

        {actionMessage ? (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '6px' }}>{actionMessage}</div>
        ) : null}
        {actionError ? (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px' }}>{actionError}</div>
        ) : null}

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search by order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />

          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', color: '#4b5563' }}>No orders match the current filters.</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredOrders.map((order) => {
              const status = String(order.status || '').toUpperCase();
              const itemCount = Array.isArray(order.items) ? order.items.length : 0;
              const subtotal = parseFloat(order.totalAmount || '0');

              return (
                <div key={order.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Order #{order.id}</div>
                      <div style={{ color: '#4b5563', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                        Customer: {order.customerName || 'N/A'} • Items: {itemCount}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.35rem 0.7rem', borderRadius: '999px', fontWeight: 600, ...getStatusBadgeStyle(status) }}>{status}</span>
                      <strong>${subtotal.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '0.95rem' }}>
                    Shipping address: {order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.country}${order.shippingAddress.zipCode ? `, ${order.shippingAddress.zipCode}` : ''}` : 'N/A'}
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setExpandedOrderId((prev) => prev === order.id ? null : order.id)} style={{ padding: '0.6rem 0.9rem', border: 'none', borderRadius: '6px', background: '#e5e7eb', color: '#111827', cursor: 'pointer' }}>
                      {expandedOrderId === order.id ? 'Hide details' : 'View details'}
                    </button>
                    {renderActions(order)}
                  </div>

                  {expandedOrderId === order.id ? (
                    <div style={{ marginTop: '1rem', padding: '0.9rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Purchased products</div>
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                          {order.items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.7rem', background: '#f9fafb', borderRadius: '6px' }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>Qty: {item.quantity}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>Unit price: ${parseFloat(item.price || '0').toFixed(2)}</div>
                                <div style={{ fontWeight: 600 }}>Line total: ${(parseFloat(item.price || '0') * item.quantity).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#4b5563' }}>No items available for this order.</div>
                      )}

                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                        <span style={{ fontWeight: 700 }}>Order Total</span>
                        <strong>${subtotal.toFixed(2)}</strong>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function buttonStyle(disabled) {
  return {
    padding: '0.6rem 0.9rem',
    border: 'none',
    borderRadius: '6px',
    background: disabled ? '#9ca3af' : '#111827',
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer'
  };
}

function secondaryButtonStyle(disabled) {
  return {
    padding: '0.6rem 0.9rem',
    border: 'none',
    borderRadius: '6px',
    background: disabled ? '#d1d5db' : '#e5e7eb',
    color: '#111827',
    cursor: disabled ? 'not-allowed' : 'pointer'
  };
}

export default AdminOrdersPage;
