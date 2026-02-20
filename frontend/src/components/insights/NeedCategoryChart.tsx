import { useState, useEffect } from 'react';
import { api, type TimeRange, type NeedCategoryItem } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface NeedCategoryChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Benefit decision': 'var(--chart-1)',
  'Routine admin': 'var(--chart-2)',
  'Service failure': 'var(--danger)',
  'Other': 'var(--chart-4)',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Benefit decision': '◈',
  'Routine admin': '◇',
  'Service failure': '◉',
  'Other': '○',
};

function sentimentColor(s: number) {
  if (s < 40) return 'var(--danger)';
  if (s < 65) return '#b8860b';
  return 'var(--success)';
}

export function NeedCategoryChart({ timeRange, onDrillDown }: NeedCategoryChartProps) {
  const [categories, setCategories] = useState<NeedCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getNeedCategories(timeRange).then((r) => {
      setCategories(r.categories);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading member needs…</div>;

  const total = categories.reduce((s, c) => s + c.count, 0);

  return (
    <div className="widget insight-widget">
      <WidgetHeading title="Why members contact OMERS" infoText="Categories of member needs (e.g. information, transaction, complaint). Click a segment to see those calls." />
      <p className="widget-insight-caption">
        Strategic mix of contact reasons — each category maps to a different operational lever.
      </p>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 36, borderRadius: 6, overflow: 'hidden', marginBottom: '1.25rem' }}>
        {categories.map((cat) => (
          <div
            key={cat.category}
            title={`${cat.category}: ${cat.count} calls (${cat.percentage}%)`}
            onClick={() => onDrillDown(cat.callIds)}
            style={{
              width: `${cat.percentage}%`,
              background: CATEGORY_COLORS[cat.category] ?? 'var(--chart-4)',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--bg-page)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '0.8')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '1')}
          >
            {cat.percentage >= 10 ? `${cat.percentage}%` : ''}
          </div>
        ))}
      </div>

      {/* Category stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {categories.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => onDrillDown(cat.callIds)}
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${CATEGORY_COLORS[cat.category] ?? 'var(--border)'}`,
              borderRadius: 8,
              padding: '0.75rem',
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--text)',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ color: CATEGORY_COLORS[cat.category], fontSize: 14 }}>
                {CATEGORY_ICONS[cat.category] ?? '○'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                {cat.category}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{cat.count.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {cat.percentage}% of {total.toLocaleString()} calls
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: 12, fontWeight: 600, color: sentimentColor(cat.avgMemberSentiment) }}>
              Avg sentiment: {cat.avgMemberSentiment}
            </div>
          </button>
        ))}
      </div>
      <p className="widget-hint">Click any segment or card to view calls</p>
    </div>
  );
}
