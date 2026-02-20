import type { TimeRange } from '../api';
import './TimeFilter.css';

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

interface TimeFilterProps {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  return (
    <div className="time-filter">
      <span className="time-filter-label">Time range</span>
      <div className="time-filter-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={opt.value === value ? 'active' : ''}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
