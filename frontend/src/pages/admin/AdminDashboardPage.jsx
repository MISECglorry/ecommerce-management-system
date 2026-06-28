import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError('');

      try {
        const [dashboardData, allOrders, lowStockData] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/orders/all').catch(() => []),
          api.get('/admin/reports/low-stock?threshold=10').catch(() => [])
        ]);

        if (!isMounted) return;

        setDashboard(dashboardData || null);
        setOrders(Array.isArray(allOrders) ? allOrders : []);
        setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load the admin dashboard right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const metrics = useMemo(() => {
    if (!dashboard) return [];

    const createdCount = orders.filter((order) => String(order.status || '').toUpperCase() === 'CREATED').length;
    const processingCount = orders.filter((order) => String(order.status || '').toUpperCase() === 'PROCESSING').length;

    return [
      { label: 'Total Products', value: dashboard.totalProducts ?? 'N/A' },
      { label: 'Total Customers', value: dashboard.totalUsers ?? 'N/A' },
      { label: 'Total Orders', value: dashboard.totalOrders ?? 'N/A' },
      { label: 'Total Revenue', value: dashboard.totalRevenue != null ? `$${Number(dashboard.totalRevenue).toFixed(2)}` : 'N/A' },
      { label: 'Orders in CREATED', value: createdCount },
      { label: 'Orders in PROCESSING', value: processingCount },
      { label: 'Low-stock products', value: lowStockProducts.length }
    ];
  }, [dashboard, orders, lowStockProducts]);

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Loading dashboard...</h2>
          <p className="page-subtitle">Collecting the latest store metrics.</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="status-message status-error" style={{ marginTop: '0.75rem' }}>{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel panel-padding">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle">Overview of the store’s current performance.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {metrics.map((metric) => (
            <div key={metric.label} className="panel-card">
              <div className="muted" style={{ fontSize: '0.9rem' }}>{metric.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem' }}>{metric.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-padding">
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/admin/orders" className="btn btn-primary">
            Manage Orders
          </Link>
          <Link to="/admin/reports" className="btn btn-primary">
            Reports
          </Link>
          <Link to="/admin/segments" className="btn btn-primary">
            Customer Segmentation
          </Link>
          <Link to="/admin/recommendations" className="btn btn-primary">
            Recommendation Analytics
          </Link>
        </div>
      </section>

      <section className="panel panel-padding">
        <h3 style={{ marginTop: 0 }}>Low-stock Products</h3>
        {lowStockProducts.length === 0 ? (
          <p className="page-subtitle">No low-stock products were returned by the backend.</p>
        ) : (
          <div className="stack-sm">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="panel-card">
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div className="muted" style={{ fontSize: '0.95rem', marginTop: '0.2rem' }}>Stock: {product.stock}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
