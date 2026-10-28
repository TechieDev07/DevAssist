import { Outlet, NavLink } from 'react-router-dom';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo">⬡</span>
          <span className="topbar__name">DevAssist</span>
          <span className="topbar__tagline">Issue Classifier</span>
        </div>
        <nav className="topbar__nav">
          <NavLink to="/dashboard" className={({ isActive }) => 'topbar__link' + (isActive ? ' active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/classify" className={({ isActive }) => 'topbar__link' + (isActive ? ' active' : '')}>
            Classify
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => 'topbar__link' + (isActive ? ' active' : '')}>
            History
          </NavLink>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
