import './AlertBanner.css';

interface AlertBannerProps {
  message: string;
  count: number;
  threshold: number;
  onDismiss?: () => void;
}

export function AlertBanner({ message, count, threshold, onDismiss }: AlertBannerProps) {
  return (
    <div className="alert-banner" role="alert">
      <span className="alert-icon">⚠</span>
      <div className="alert-content">
        <strong>High complaint volume</strong>
        <p>{message}</p>
        <span className="alert-stats">
          {count} complaints in last 60 min (threshold: {threshold})
        </span>
      </div>
      {onDismiss && (
        <button type="button" className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
