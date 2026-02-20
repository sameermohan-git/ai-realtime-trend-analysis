import { useState, useEffect } from 'react';
import { api, type TimeRange, type HeatmapCell } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface OutcomeHeatmapChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

// Linear interpolation between danger (#e85d5d) and success (#3fb950) based on sentiment 0–10
function sentimentToColor(sentiment: number, alpha = 1): string {
  const t = Math.max(0, Math.min(sentiment / 10, 1));
  const r = Math.round(232 + t * (63 - 232));
  const g = Math.round(93 + t * (185 - 93));
  const b = Math.round(93 + t * (80 - 93));
  return `rgba(${r},${g},${b},${alpha})`;
}

export function OutcomeHeatmapChart({ timeRange, onDrillDown }: OutcomeHeatmapChartProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [intents, setIntents] = useState<string[]>([]);
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getOutcomeHeatmap(timeRange).then((r) => {
      setTopics(r.topics);
      setIntents(r.intents);
      setCells(r.cells);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading outcome heatmap…</div>;

  // Build lookup for fast cell access
  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach((c) => cellMap.set(`${c.topic}||${c.intent}`, c));

  const shortLabel = (s: string, max = 14) => s.length > max ? s.slice(0, max) + '…' : s;

  return (
    <div className="widget insight-widget" style={{ overflowX: 'auto' }}>
      <WidgetHeading title="Outcome heatmap: topic × intent" infoText="Call volume for each topic × intent combination. Darker cells = more calls. Click a cell to view those calls." />
      <p className="widget-insight-caption">
        Red cells with high counts are where member frustration is concentrated — highest-ROI redesign targets.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${intents.length}, 1fr)`, gap: 3, minWidth: 460 }}>
        {/* Header row: intent labels */}
        <div /> {/* top-left empty */}
        {intents.map((intent) => (
          <div
            key={intent}
            title={intent}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '0 2px 6px',
              lineHeight: 1.2,
            }}
          >
            {shortLabel(intent, 12)}
          </div>
        ))}

        {/* Data rows */}
        {topics.map((topic) => (
          [
            /* Topic label */
            <div
              key={`label-${topic}`}
              title={topic}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                paddingRight: 6,
                lineHeight: 1.2,
              }}
            >
              {shortLabel(topic)}
            </div>,

            /* Cells for this topic */
            ...intents.map((intent) => {
              const key = `${topic}||${intent}`;
              const cell = cellMap.get(key);
              const isHovered = hovered === key;

              if (!cell) {
                return (
                  <div
                    key={key}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 4,
                      minHeight: 52,
                      opacity: 0.3,
                      border: '1px dashed var(--border)',
                    }}
                  />
                );
              }

              return (
                <div
                  key={key}
                  title={`${topic} × ${intent}\n${cell.count} calls\nAvg sentiment: ${cell.avgMemberSentiment}`}
                  onClick={() => onDrillDown(cell.callIds)}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: sentimentToColor(cell.avgMemberSentiment, isHovered ? 1 : 0.82),
                    borderRadius: 4,
                    minHeight: 52,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 0.12s, background 0.12s',
                    boxShadow: isHovered ? '0 0 0 2px var(--accent)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#000', lineHeight: 1 }}>
                    {cell.count}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.65)', marginTop: 2 }}>
                    {cell.avgMemberSentiment}
                  </span>
                </div>
              );
            }),
          ]
        ))}
      </div>

      {/* Colour scale legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '1rem', fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Low satisfaction</span>
        <div style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(to right, ${sentimentToColor(0)}, ${sentimentToColor(5)}, ${sentimentToColor(10)})`,
        }} />
        <span>High satisfaction</span>
      </div>
      <p className="widget-hint">Cell shows call count / avg sentiment score. Click to drill down.</p>
    </div>
  );
}
