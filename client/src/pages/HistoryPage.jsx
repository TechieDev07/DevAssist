import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getIssues, deleteIssue } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatDate, truncate } from '../utils/format';
import './HistoryPage.css';

const CATEGORIES = ['', 'bug', 'feature', 'question'];
const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      const res = await getIssues(params);
      setIssues(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this classification record?')) return;
    setDeletingId(id);
    try {
      await deleteIssue(id);
      fetchIssues();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="history-page">
      <div className="dashboard__header">
        <div>
          <h1 className="page-title">Classification History</h1>
          <p className="page-subtitle">{pagination.total} total records</p>
        </div>
        <Link to="/classify" className="btn btn--primary">+ Classify Issue</Link>
      </div>

      {/* Filters */}
      <div className="history-filters card">
        <input
          type="search"
          className="form-control"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 320 }}
        />
        <div className="category-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat || 'all'}
              className={`btn btn--sm ${category === cat ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchIssues} />

      {loading ? (
        <LoadingSpinner fullPage text="Loading history…" />
      ) : issues.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <div className="empty-state__title">No issues found</div>
            <div className="empty-state__desc">
              {search || category ? 'No results match your filters.' : 'Classify your first issue to see it here.'}
            </div>
            {!search && !category && (
              <Link to="/classify" className="btn btn--primary" style={{ marginTop: '1rem' }}>
                Classify an Issue
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Classified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id || issue._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/issues/${issue.id || issue._id}`)}>
                    <td>
                      <span title={issue.title}>{truncate(issue.title, 70)}</span>
                      {issue.repositoryName && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {issue.repositoryName}
                        </span>
                      )}
                    </td>
                    <td><CategoryBadge category={issue.predictedCategory} /></td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatDate(issue.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                        <Link to={`/issues/${issue.id || issue._id}`} className="btn btn--ghost btn--sm">View</Link>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={(e) => handleDelete(issue.id || issue._id, e)}
                          disabled={deletingId === (issue.id || issue._id)}
                        >
                          {deletingId === (issue.id || issue._id) ? <span className="spinner" /> : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="pagination__info">Page {page} of {pagination.pages}</span>
          <button className="btn btn--secondary btn--sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
