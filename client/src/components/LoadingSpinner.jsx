export default function LoadingSpinner({ text = 'Loading…', fullPage = false }) {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
        <span>{text}</span>
      </div>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      <span className="spinner" />
      {text}
    </span>
  );
}
