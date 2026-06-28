import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCheckoutData() {
      setLoading(true);
      setError('');

      try {
        const [items, userAddresses] = await Promise.all([
          api.get('/cart'),
          api.get('/addresses')
        ]);

        if (isMounted) {
          const itemList = Array.isArray(items) ? items : [];
          if (itemList.length === 0) {
            navigate('/cart', { replace: true });
            return;
          }
          setCartItems(itemList);
          setAddresses(Array.isArray(userAddresses) ? userAddresses : []);
          if (userAddresses.length > 0) {
            setSelectedAddressId(String(userAddresses[0].id));
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load checkout data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCheckoutData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setError('Please select a shipping address.');
      return;
    }

    setPlacing(true);
    setError('');

    try {
      await api.post('/orders/checkout', {
        shippingAddressId: parseInt(selectedAddressId, 10)
      });

      setSuccess(true);
      window.dispatchEvent(new Event('cart-updated'));
      setTimeout(() => {
        navigate('/orders', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Unable to place order. Please try again.');
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Loading checkout data...</h2>
          <p className="page-subtitle">Preparing your order summary.</p>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding status-success" style={{ textAlign: 'center' }}>
          <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>Order Placed Successfully!</h2>
          <p className="page-subtitle">Redirecting to your orders...</p>
        </section>
      </div>
    );
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.totalPrice) || 0),
    0
  );

  return (
    <div className="page-shell">
      <section className="panel panel-padding">
        <h2 className="page-title">Checkout</h2>
        <p className="page-subtitle">Review your items and confirm your delivery details.</p>

        {error ? <div className="status-message status-error" style={{ marginBottom: '1rem' }}>{error}</div> : null}

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Order Summary</h3>
          <div className="stack-sm">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontWeight: 600 }}>{item.productName}</p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>
                    Qty: {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                  </p>
                </div>
                <strong>${parseFloat(item.totalPrice).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Total:</span>
            <strong style={{ fontSize: '1.35rem' }}>${totalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Shipping Address</h3>
          {addresses.length === 0 ? (
            <p className="status-message status-error">No addresses available. Please add a shipping address.</p>
          ) : (
            <label className="form-field">
              <span className="muted">Select delivery address</span>
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                disabled={placing}
                className="form-control"
                style={{ cursor: placing ? 'not-allowed' : 'pointer' }}
              >
                <option value="">-- Select an address --</option>
                {addresses.map((address) => (
                  <option key={address.id} value={String(address.id)}>
                    {address.street}, {address.city}, {address.country} {address.zipCode}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button type="button" onClick={handlePlaceOrder} disabled={placing || addresses.length === 0} className="btn btn-primary">
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </section>
    </div>
  );
}

export default CheckoutPage;
