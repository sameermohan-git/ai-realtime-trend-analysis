import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { api, type TimeRange, type SentimentArcItem } from '../../api';
import '../Widget.css';

interface SentimentArcChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function SentimentArcChart({ timeRange, onDrillDown }: SentimentArcChartProps) {
  const [arcs, setArcs] = useState<SentimentArcItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSentimentArc(timeRange).then((r) => {
      // Show top 8 by absolute delta magnitude so chart stays legible
      setArcs(r.arcs.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading sentiment arc…</div>;

  const data = arcs.map((a) => ({
    ...a,
    name: a.intent.length > 20 ? a.intent.slice(0, 20) + '…' : a.intent,
    // Recharts grouped bar needs both values in each row
    opening: a.openingSentiment,
    closing: a.closingSentiment,
    improved: a.delta >= 0,
  }));

  return (
    <div className="widget insight-widget">
      <h2 className="widget-title">Did we help? Sentiment arc by intent</h2>
      <p className="widget-insight-caption">
        Opening vs closing member sentiment per call reason — negative delta means the call made things worse.
      </p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56 }}>
            <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload as typeof data[0];
                return (
                  <div className="chart-tooltip">
                    <span style={{ fontWeight: 600 }}>{d.intent}</span>
                    <span>Opening sentiment: {d.openingSentiment}</span>
                    <span>Closing sentiment: {d.closingSentiment}</span>
                    <span style={{ color: d.improved ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      Delta: {d.delta >= 0 ? '+' : ''}{d.delta}
                    </span>
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
            {/* Opening sentiment — muted reference bar */}
            <Bar dataKey="opening" name="Opening" barSize={8} fill="var(--chart-2)" fillOpacity={0.35} radius={[0, 3, 3, 0]} />
            {/* Closing sentiment — colored by improvement */}
            <Bar dataKey="closing" name="Closing" barSize={8} radius={[0, 3, 3, 0]}
              onClick={(entry) => entry?.callIds && onDrillDown(entry.callIds)}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.improved ? 'var(--success)' : 'var(--danger)'} />
              ))}
              <LabelList
                dataKey="delta"
                position="right"
                style={{ fontSize: 11, fontWeight: 700, fill: 'var(--text)' }}
                formatter={(v: number) => (v >= 0 ? `+${v}` : `${v}`)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: 11, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 8, background: 'var(--chart-2)', opacity: 0.35, display: 'inline-block', borderRadius: 2 }} />
          Opening
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 8, background: 'var(--success)', display: 'inline-block', borderRadius: 2 }} />
          Closing (improved)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 8, background: 'var(--danger)', display: 'inline-block', borderRadius: 2 }} />
          Closing (worsened)
        </span>
      </div>
    </div>
  );
}
