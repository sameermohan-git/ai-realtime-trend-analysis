import { TimeFilter } from './TimeFilter';
import type { TimeRange } from '../api';
import './DashboardHeader.css';

const ENV_NAME = 'UAT';
const USER_NAME = 'Sameer Mohan';

export type Theme = 'dark' | 'light';

interface DashboardHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function DashboardHeader({ timeRange, onTimeRangeChange, theme, onThemeChange }: DashboardHeaderProps) {
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    onThemeChange(next);
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <a href="/" className="dashboard-logo-primary" aria-label="PensionsAI home">
          <img src="/images/pensionsai-logo.png" alt="PensionsAI" className="dashboard-logo-img primary" />
        </a>
      </div>
      <div className="dashboard-header-center">
        <TimeFilter value={timeRange} onChange={onTimeRangeChange} />
      </div>
      <div className="dashboard-header-right">
        <button
          type="button"
          className="dashboard-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span className="dashboard-theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <span className="dashboard-env" title="Environment">{ENV_NAME}</span>
        <span className="dashboard-user" title="Logged in user">
          <span className="dashboard-user-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </span>
          {USER_NAME}
        </span>
        <a href="/" className="dashboard-logo-omers" aria-label="OMERS">
          <img src="/images/omers-logo.png" alt="OMERS" className="dashboard-logo-img omers" />
        </a>
      </div>
    </header>
  );
}
