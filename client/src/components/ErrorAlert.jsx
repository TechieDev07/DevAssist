export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      <span>⚠</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="btn btn--ghost btn--sm" onClick={onRetry} style={{ color: 'var(--red)' }}>
          Retry
        </button>
      )}
    </div>
  );
}
