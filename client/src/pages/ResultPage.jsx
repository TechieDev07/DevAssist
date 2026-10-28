import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIssueById } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';
import ScoreBar from '../components/ScoreBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatDate, categoryLabel } from '../utils/format';
import './ResultPage.css';

export default function ResultPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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

  if (loading) return <LoadingSpinner fullPage text="Loading result…" />;
  if (error)   return <div style={{ maxWidth: 640, margin: '0 auto' }}><ErrorAlert message={error} /><Link to="/classify" className="btn btn--secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>← Classify another</Link></div>;
  if (!issue)  return null;

  const scores = issue.classScores
    ? (issue.classScores instanceof Map ? Object.fromEntries(issue.classScores) : issue.classScores)
    : null;

  const topScore = scores ? scores[issue.predictedCategory] : null;

  return (
    <div className="result-page">
      <div className="result-page__nav">
        <Link to="/classify" className="btn btn--ghost btn--sm">← Classify another</Link>
        <Link to="/history"  className="btn btn--ghost btn--sm">View history →</Link>
      </div>

      {/* Result hero */}
      <div className={`card result-hero result-hero--${issue.predictedCategory}`}>
        <div className="result-hero__label">Predicted Category</div>
        <CategoryBadge category={issue.predictedCategory} size="lg" />
        <div className="result-hero__title">{issue.title}</div>
        {topScore != null && (
          <div className="result-hero__confidence">
            Model confidence: <strong>{(topScore * 100).toFixed(1)}%</strong>
            {topScore < 0.5 && (
              <span className="result-hero__low-conf"> (low confidence — review manually)</span>
            )}
          </div>
        )}
      </div>

      {/* Scores */}
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

      {/* Details */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: '1rem' }}>Issue Details</div>
        <dl className="detail-grid">
          <dt>Title</dt>
          <dd>{issue.title}</dd>
          {issue.description && <><dt>Description</dt><dd className="detail-description">{issue.description}</dd></>}
          {issue.repositoryName && <><dt>Repository</dt><dd><code>{issue.repositoryName}</code></dd></>}
          {issue.githubIssueUrl && <><dt>GitHub URL</dt><dd><a href={issue.githubIssueUrl} target="_blank" rel="noopener noreferrer">{issue.githubIssueUrl}</a></dd></>}
          <dt>Model Version</dt>
          <dd><code>{issue.modelVersion}</code></dd>
          <dt>Classified At</dt>
          <dd>{formatDate(issue.createdAt)}</dd>
        </dl>
      </div>
    </div>
  );
}
