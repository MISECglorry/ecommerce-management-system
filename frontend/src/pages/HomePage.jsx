import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    let isMounted = true;

    async function loadHomePage() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.get('/products').catch(() => []),
          api.get('/categories').catch(() => [])
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        if (isMounted) {
          setError('Unable to load the homepage content right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHomePage();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Loading storefront...</h2>
          <p className="page-subtitle">Preparing the latest products and recommendations.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel panel-padding">
        <h2 className="page-title">Welcome to Ecommerce Management System</h2>
        <p className="page-subtitle">Browse electronics, discover recommendations, and continue shopping with confidence.</p>
      </section>

      {error ? <p className="status-message status-error">{error}</p> : null}

      <section className="panel panel-padding">
        <h3 className="section-title">Categories</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {categories.length > 0 ? (
            categories.map((category) => (
              <span key={category.id} className="panel-card" style={{ padding: '0.5rem 0.8rem', fontSize: '0.95rem' }}>
                {category.name}
              </span>
            ))
          ) : (
            <p className="empty-state" style={{ margin: 0 }}>No categories available right now.</p>
          )}
        </div>
      </section>

      <section className="panel panel-padding">
        <h3 className="section-title">Featured Products</h3>
        <div className="grid-responsive">
          {products.length > 0 ? (
            products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="panel-card"
                style={{ display: 'block', padding: '1rem', color: 'inherit', textDecoration: 'none' }}
              >
                <h4 style={{ margin: '0 0 0.35rem' }}>{product.name}</h4>
                <p style={{ fontWeight: 400, margin: 0 }}>${product.price}</p>
              </Link>
            ))
          ) : (
            <p className="empty-state" style={{ gridColumn: '1 / -1', margin: 0 }}>No products available right now.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
