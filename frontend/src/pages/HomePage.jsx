import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="page-shell">
      <section
        className="panel panel-padding"
        style={{
          display: 'grid',
          gap: '1rem',
          background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
          border: '1px solid #dbeafe'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span className="muted" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Fresh picks for every need
          </span>
          <h2 className="page-title" style={{ margin: 0 }}>Welcome to iStore</h2>
          <p className="page-subtitle" style={{ margin: 0, maxWidth: '680px' }}>
            Discover quality electronics, enjoy a smooth shopping experience, and keep track of your orders with ease.
          </p>
        </div>
        <Link to="/products" className="btn btn-primary" style={{ width: 'fit-content' }}>
          Shop Now
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
