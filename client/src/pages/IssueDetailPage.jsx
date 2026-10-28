import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getIssueById, deleteIssue } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';
import ScoreBar from '../components/ScoreBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatDate, categoryLabel } from '../utils/format';

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getIssueById(id);
        if (!cancelled) setIssue(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this issue record?')) return;
    setDeleting(true);
    try {
      await deleteIssue(id);
      navigate('/history');
    } catch (err) {
      alert('Delete failed: ' + err.message);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading issue…" />;
  if (error)   return <div style={{ maxWidth: 640, margin: '0 auto' }}><ErrorAlert message={error} /><Link to="/history" className="btn btn--secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>← Back to history</Link></div>;
  if (!issue)  return null;

  const scores = issue.classScores
    ? (issue.classScores instanceof Map ? Object.fromEntries(issue.classScores) : issue.classScores)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to="/history" className="btn btn--ghost btn--sm">← History</Link>
        <button className="btn btn--danger btn--sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? <span className="spinner" /> : 'Delete'}
        </button>
      </div>

      <div className={`card result-hero result-hero--${issue.predictedCategory}`}>
        <div className="result-hero__label">Classification Result</div>
        <CategoryBadge category={issue.predictedCategory} size="lg" />
        <div className="result-hero__title">{issue.title}</div>
      </div>

      {scores && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: '1rem' }}>Class Probability Scores</div>
          {Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([cls, val]) => (
              <ScoreBar key={cls} label={categoryLabel(cls)} value={val} category={cls} />
            ))}
        </div>
      )}

      <div className="card">
        <div className="section-title" style={{ marginBottom: '1rem' }}>Issue Details</div>
        <dl className="detail-grid">
          <dt>Title</dt>
          <dd>{issue.title}</dd>
          {issue.description && <><dt>Description</dt><dd className="detail-description">{issue.description}</dd></>}
          {issue.repositoryName && <><dt>Repository</dt><dd><code>{issue.repositoryName}</code></dd></>}
          {issue.githubIssueUrl && <><dt>GitHub URL</dt><dd><a href={issue.githubIssueUrl} target="_blank" rel="noopener noreferrer">{issue.githubIssueUrl}</a></dd></>}
          <dt>Predicted</dt>
          <dd><CategoryBadge category={issue.predictedCategory} /></dd>
          {issue.confirmedCategory && <><dt>Confirmed</dt><dd><CategoryBadge category={issue.confirmedCategory} /></dd></>}
          <dt>Model Version</dt>
          <dd><code>{issue.modelVersion}</code></dd>
          <dt>Classified At</dt>
          <dd>{formatDate(issue.createdAt)}</dd>
        </dl>
      </div>
    </div>
  );
}
