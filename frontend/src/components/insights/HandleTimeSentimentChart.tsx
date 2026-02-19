import { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { api, type TimeRange, type HandleTimeSentimentItem } from '../../api';
import '../Widget.css';

interface HandleTimeSentimentChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function complaintColor(rate: number) {
  // 0% = success, 50%+ = danger, linear interpolation
  const t = Math.min(rate / 50, 1);
  const r = Math.round(63 + t * (232 - 63));
  const g = Math.round(185 + t * (93 - 185));
  const b = Math.round(80 + t * (93 - 80));
  return `rgb(${r},${g},${b})`;
}

export function HandleTimeSentimentChart({ timeRange, onDrillDown }: HandleTimeSentimentChartProps) {
  const [intents, setIntents] = useState<HandleTimeSentimentItem[]>([]);
  const [avgHandleTime, setAvgHandleTime] = useState(0);
  const [avgSentiment, setAvgSentiment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getHandleTimeSentiment(timeRange).then((r) => {
      setIntents(r.intents);
      setAvgHandleTime(r.avgHandleTimeSec);
      setAvgSentiment(r.avgMemberSentiment);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading efficiency frontier…</div>;

  const maxCount = Math.max(...intents.map((i) => i.count), 1);

  // Quadrant labels positioned as custom SVG — rendered via recharts customized label
  const QuadrantLabels = () => (
    <>
      {/* We render these as absolutely positioned overlays on the chart area */}
    </>
  );

  return (
    <div className="widget insight-widget" style={{ position: 'relative' }}>
      <h2 className="widget-title">Efficiency & satisfaction frontier</h2>
      <p className="widget-insight-caption">
        Bubble size = call volume. Colour = complaint rate (red = high). Bottom-right = longest and most frustrating.
      </p>

      {/* Quadrant key */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem', fontSize: 11, color: 'var(--text-muted)' }}>
        {[
          { label: 'Fast & Satisfied', color: 'var(--success)' },
          { label: 'Thorough & Satisfied', color: 'var(--chart-2)' },
          { label: 'Fast & Frustrated', color: '#b8860b' },
          { label: 'Long & Frustrated', color: 'var(--danger)' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ left: 8, right: 16, bottom: 24, top: 8 }}>
            <XAxis
              type="number"
              dataKey="avgHandleTimeSec"
              name="Avg handle time"
              tickFormatter={(v) => `${Math.floor(v / 60)}m`}
              stroke="var(--text-muted)"
              fontSize={11}
              label={{ value: 'Avg handle time', position: 'insideBottom', offset: -12, fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="avgMemberSentiment"
              name="Avg member sentiment"
              domain={[0, 100]}
              stroke="var(--text-muted)"
              fontSize={11}
              label={{ value: 'Avg sentiment', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="count" range={[60, 600]} />
            <ReferenceLine
              x={avgHandleTime}
              stroke="var(--border)"
              strokeDasharray="4 4"
              label={{ value: 'Avg AHT', position: 'top', fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <ReferenceLine
              y={avgSentiment}
              stroke="var(--border)"
              strokeDasharray="4 4"
              label={{ value: 'Avg sentiment', position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload as HandleTimeSentimentItem;
                return (
                  <div className="chart-tooltip">
                    <span style={{ fontWeight: 600 }}>{d.intent}</span>
                    <span>Avg handle time: {formatSec(d.avgHandleTimeSec)}</span>
                    <span>Avg member sentiment: {d.avgMemberSentiment}</span>
                    <span>Complaint rate: {d.complaintRatePct}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>{d.count} calls</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDrillDown(d.callIds); }}
                    >
                      View calls
                    </button>
                  </div>
                );
              }}
            />
            <Scatter data={intents}>
              {intents.map((d, i) => (
                <Cell
                  key={i}
                  fill={complaintColor(d.complaintRatePct)}
                  fillOpacity={0.75 + (d.count / maxCount) * 0.25}
                  onClick={() => onDrillDown(d.callIds)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
