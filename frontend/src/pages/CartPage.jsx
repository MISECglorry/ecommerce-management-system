import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCart() {
      setLoading(true);
      setError('');

      try {
        const items = await api.get('/cart');
        if (isMounted) {
          setCartItems(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load your cart. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  async function handleUpdateQuantity(cartItemId, newQuantity) {
    const parsedQuantity = Number(newQuantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return;
    }

    setUpdatingItemId(cartItemId);
    setError('');

    try {
      const response = await api.put(`/cart/${cartItemId}/quantity`, { quantity: newQuantity });
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                quantity: response.quantity,
                totalPrice: response.totalPrice
              }
            : item
        )
      );
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err?.message || 'Unable to update quantity. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRemoveItem(cartItemId) {
    setRemovingItemId(cartItemId);
    setError('');

    try {
      await api.delete(`/cart/${cartItemId}`);
      setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err?.message || 'Unable to remove item. Please try again.');
      setRemovingItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Loading your cart...</h2>
          <p className="page-subtitle">Refreshing the latest items in your basket.</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Unable to load your cart</h2>
          <p className="status-message status-error" style={{ marginTop: '0.75rem' }}>{error}</p>
        </section>
      </div>
    );
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.totalPrice) || 0),
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding" style={{ textAlign: 'center' }}>
          <h2 className="page-title">Your Shopping Cart</h2>
          <p className="page-subtitle" style={{ marginBottom: '1rem' }}>Your shopping cart is empty.</p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel panel-padding">
        <h2 className="page-title">Your Shopping Cart</h2>
        <p className="page-subtitle" style={{ marginBottom: '1.25rem' }}>
          {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
        </p>

        <div className="stack-sm">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="panel-card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', padding: '1rem', alignItems: 'start' }}>
              <img src="https://picsum.photos/seed/product/200/200" alt={item.productName} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem' }}>{item.productName}</h4>
                  <p className="muted" style={{ margin: 0 }}>Unit Price: ${parseFloat(item.unitPrice).toFixed(2)}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <label className="form-field" style={{ minWidth: '130px' }}>
                    <span className="muted">Quantity</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.cartItemId, parseInt(e.target.value, 10))}
                      disabled={updatingItemId === item.cartItemId}
                      className="form-control"
                      style={{ width: '70px' }}
                    />
                  </label>

                  <button type="button" onClick={() => handleRemoveItem(item.cartItemId)} disabled={removingItemId === item.cartItemId} className="btn btn-secondary">
                    {removingItemId === item.cartItemId ? 'Removing...' : 'Remove'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="muted">Line Total:</span>
                  <strong style={{ fontSize: '1.1rem' }}>${parseFloat(item.totalPrice).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-padding" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Total Items:</span>
          <span>{totalItems}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 600 }}>Total Amount:</span>
          <strong style={{ fontSize: '1.4rem' }}>${totalAmount.toFixed(2)}</strong>
        </div>

        <button type="button" onClick={() => navigate('/checkout')} className="btn btn-primary">
          Proceed to Checkout
        </button>

        <Link to="/products" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </section>
    </div>
  );
}

export default CartPage;
