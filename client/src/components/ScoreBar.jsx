import { formatPct } from '../utils/format';

export default function ScoreBar({ label, value, category }) {
  const pct = value != null ? value * 100 : 0;
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`score-bar-fill score-bar-fill--${category}`}
          style={{ width: `${pct.toFixed(1)}%` }}
        />
      </div>
      <span className="score-bar-pct">{formatPct(value)}</span>
    </div>
  );
}
