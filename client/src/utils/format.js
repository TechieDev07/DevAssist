/** Format an ISO timestamp to a human-readable string */
export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Return a CSS class name for a category */
export function categoryClass(category) {
  const map = { bug: 'badge--bug', feature: 'badge--feature', question: 'badge--question' };
  return map[category] || 'badge--unknown';
}

/** Return a display label for a category */
export function categoryLabel(category) {
  const map = { bug: 'Bug', feature: 'Feature Request', question: 'Question' };
  return map[category] || category || 'Unknown';
}

/** Format a probability as a percentage string */
export function formatPct(value) {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

/** Truncate text to maxLength with ellipsis */
export function truncate(text, maxLength = 80) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}
