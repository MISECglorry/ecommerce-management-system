import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';

const FILTER_OPTIONS = ['All Reports', 'Active Reports'];

function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All Reports');
  const [runningReportId, setRunningReportId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [historyMap, setHistoryMap] = useState({});
  const [loadingHistoryId, setLoadingHistoryId] = useState(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadReports() {
      setLoading(true);
      setError('');

      try {
        const [reportsData, lowStockData] = await Promise.all([
          api.get('/admin/reports'),
          api.get('/admin/reports/low-stock?threshold=10').catch(() => [])
        ]);

        if (!isMounted) return;

        setReports(Array.isArray(reportsData) ? reportsData : []);
        setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load reports right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredReports = useMemo(() => {
    if (filter === 'Active Reports') {
      return reports.filter((report) => report.enabled);
    }
    return reports;
  }, [reports, filter]);

  async function handleRunReport(report) {
    setRunningReportId(report.id);
    setMessage('');
    setMessageType('success');

    try {
      const execution = await api.post(`/admin/reports/${report.id}/run`, {});
      setMessage(`Report "${report.name}" started successfully.`);
      if (execution?.status) {
        setMessage((prev) => `${prev} Status: ${execution.status}`);
      }
      if (execution?.fileName) {
        setMessage((prev) => `${prev} File: ${execution.fileName}`);
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err?.message || 'Unable to run the report.');
    } finally {
      setRunningReportId(null);
    }
  }

  async function handleViewHistory(report) {
    setLoadingHistoryId(report.id);
    try {
      const history = await api.get(`/admin/reports/${report.id}/history`);
      setHistoryMap((prev) => ({ ...prev, [report.id]: Array.isArray(history) ? history : [] }));
    } catch (err) {
      setMessageType('error');
      setMessage(err?.message || 'Unable to load report history.');
    } finally {
      setLoadingHistoryId(null);
    }
  }

  async function handleDownloadLatest(report) {
    try {
      const response = await fetch(`/api/admin/reports/${report.id}/download`, {
        headers: {
          ...(localStorage.getItem('ecommerce_token') ? { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Unable to download the latest report.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.name || 'report'}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`Downloaded latest report for "${report.name}".`);
    } catch (err) {
      setMessageType('error');
      setMessage(err?.message || 'Unable to download the latest report.');
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Loading reports...</h2>
          <p className="page-subtitle">Fetching the latest reporting options.</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="panel panel-padding">
          <h2 className="page-title">Admin Reports</h2>
          <p className="status-message status-error" style={{ marginTop: '0.75rem' }}>{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel panel-padding">
        <h2 className="page-title">Admin Reports</h2>
        <p className="page-subtitle">Run and review available reports from the backend.</p>

        {message ? (
          <div className={`status-message ${messageType === 'success' ? 'status-success' : 'status-error'}`} style={{ marginBottom: '1rem' }}>
            {message}
          </div>
        ) : null}

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-field" style={{ maxWidth: '220px' }}>
            <span className="muted">Filter reports</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-control">
              {FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        {filteredReports.length === 0 ? (
          <div className="panel-card">No reports are available at the moment.</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {filteredReports.map((report) => {
              const history = historyMap[report.id] || [];
              const isRunning = runningReportId === report.id;
              const isHistoryLoading = loadingHistoryId === report.id;

              return (
                <div key={report.id} className="panel-card" style={{ display: 'grid', gap: '0.8rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{report.name}</div>
                    <div className="muted" style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>{report.description || 'No description provided.'}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="muted" style={{ fontSize: '0.95rem' }}>Type: {report.reportType || 'N/A'}</span>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '999px', background: report.enabled ? '#dcfce7' : '#f3f4f6', color: report.enabled ? '#166534' : '#374151', fontSize: '0.85rem' }}>
                      {report.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button type="button" disabled={isRunning} onClick={() => handleRunReport(report)} style={primaryButtonStyle(isRunning)}>
                      {isRunning ? 'Running...' : 'Run Report'}
                    </button>
                    <button type="button" onClick={() => handleDownloadLatest(report)} style={secondaryButtonStyle()}>
                      Download Latest Report
                    </button>
                    <button type="button" disabled={isHistoryLoading} onClick={() => handleViewHistory(report)} style={secondaryButtonStyle(isHistoryLoading)}>
                      {isHistoryLoading ? 'Loading...' : 'View History'}
                    </button>
                  </div>

                  {history.length > 0 ? (
                    <div style={{ marginTop: '0.35rem', display: 'grid', gap: '0.5rem' }}>
                      {history.map((entry) => (
                        <div key={entry.id} className="panel-card" style={{ padding: '0.7rem' }}>
                          <div className="muted" style={{ fontSize: '0.9rem' }}>Created: {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}</div>
                          <div className="muted" style={{ fontSize: '0.9rem' }}>Status: {entry.status || 'N/A'}</div>
                          {entry.fileName ? <div className="muted" style={{ fontSize: '0.9rem' }}>File: {entry.fileName}</div> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel panel-padding">
        <h3 style={{ marginTop: 0 }}>Low Stock</h3>
        {lowStockProducts.length === 0 ? (
          <p className="page-subtitle">No low-stock products were returned by the backend.</p>
        ) : (
          <div className="stack-sm">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="panel-card">
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div className="muted" style={{ fontSize: '0.95rem', marginTop: '0.2rem' }}>Current stock: {product.stock}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function primaryButtonStyle(disabled) {
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

export default AdminReportsPage;
