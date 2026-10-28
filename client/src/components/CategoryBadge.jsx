import { categoryClass, categoryLabel } from '../utils/format';

const ICONS = { bug: '🐛', feature: '✨', question: '❓' };

export default function CategoryBadge({ category, size = '' }) {
  return (
    <span className={`badge ${categoryClass(category)} ${size === 'lg' ? 'badge--lg' : ''}`}>
      <span aria-hidden="true">{ICONS[category] || '•'}</span>
      {categoryLabel(category)}
    </span>
  );
}
