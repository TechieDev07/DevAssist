import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getStats } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatDate } from '../utils/format';
import './DashboardPage.css';

const COLORS = { bug: '#f85149', feature: '#3fb950', question: '#58a6ff' };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStats();
      setStats(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const chartData = stats
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of classified GitHub issues</p>
        </div>
        <Link to="/classify" className="btn btn--primary">
          + Classify Issue
        </Link>
      </div>

      <ErrorAlert message={error} onRetry={fetchStats} />

      {loading && <LoadingSpinner fullPage text="Loading statistics…" />}

      {!loading && stats && (
        <>
          {/* Stat cards */}
          <div className="stat-grid">
            <div className="card card--elevated stat-card">
              <div className="stat-card__icon">📋</div>
              <div className="stat-card__value">{stats.total}</div>
              <div className="stat-card__label">Total Classified</div>
            </div>
            <div className="card card--elevated stat-card">
              <div className="stat-card__icon">🐛</div>
              <div className="stat-card__value" style={{ color: 'var(--bug-text)' }}>{stats.byCategory.bug || 0}</div>
              <div className="stat-card__label">Bugs</div>
            </div>
            <div className="card card--elevated stat-card">
              <div className="stat-card__icon">✨</div>
              <div className="stat-card__value" style={{ color: 'var(--feature-text)' }}>{stats.byCategory.feature || 0}</div>
              <div className="stat-card__label">Feature Requests</div>
            </div>
            <div className="card card--elevated stat-card">
              <div className="stat-card__icon">❓</div>
              <div className="stat-card__value" style={{ color: 'var(--question-text)' }}>{stats.byCategory.question || 0}</div>
              <div className="stat-card__label">Questions</div>
            </div>
          </div>

          {/* Chart + recent activity */}
          <div className="dashboard__lower">
            {/* Pie chart */}
            <div className="card" style={{ flex: '1' }}>
              <div className="section-header">
                <span className="section-title">Category Distribution</span>
              </div>
              {stats.total === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">📊</div>
                  <div className="empty-state__title">No data yet</div>
                  <div className="empty-state__desc">Classify some issues to see the distribution.</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent activity */}
            <div className="card" style={{ flex: '1' }}>
              <div className="section-header">
                <span className="section-title">Recent Activity</span>
                <Link to="/history" className="btn btn--ghost btn--sm">View all →</Link>
              </div>
              {stats.recentActivity.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🕑</div>
                  <div className="empty-state__title">No activity yet</div>
                  <div className="empty-state__desc">Your recent classifications will appear here.</div>
                </div>
              ) : (
                <ul className="recent-list">
                  {stats.recentActivity.map((item) => (
                    <li key={item.id} className="recent-item">
                      <div className="recent-item__left">
                        <Link to={`/issues/${item.id}`} className="recent-item__title">
                          {item.title}
                        </Link>
                        <span className="recent-item__date">{formatDate(item.createdAt)}</span>
                      </div>
                      <CategoryBadge category={item.predictedCategory} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !stats && !error && (
        <div className="empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__title">No data available</div>
        </div>
      )}
    </div>
  );
}
