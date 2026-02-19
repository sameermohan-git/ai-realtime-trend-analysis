import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type EmotionProfileItem } from '../../api';
import '../Widget.css';

interface EmotionProfileChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

const EMOTION_LABELS: Record<string, string> = {
  angry: 'Angry',
  disappointed: 'Disappointed',
  concerned: 'Concerned',
  neutral: 'Neutral',
  satisfied: 'Satisfied',
  relieved: 'Relieved',
};

export function EmotionProfileChart({ timeRange, onDrillDown }: EmotionProfileChartProps) {
  const [emotions, setEmotions] = useState<EmotionProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getEmotionProfile(timeRange).then((r) => {
      setEmotions(r.emotions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading emotion profile…</div>;

  const data = emotions.map((e) => ({
    ...e,
    name: EMOTION_LABELS[e.emotion] ?? e.emotion,
    // Scale 0–1 values to 0–100 for readable axes
    complaintPct: Math.round(e.complaintAvg * 100),
    nonComplaintPct: Math.round(e.nonComplaintAvg * 100),
    uplift: Math.round((e.complaintAvg - e.nonComplaintAvg) * 100),
  }));

  // Emotions elevated in complaints get a danger fill; depressed ones (satisfied, relieved) get success fill
  const complaintFillFor = (d: typeof data[0]) =>
    d.uplift > 0 ? 'var(--danger)' : 'var(--success)';

  const CHART_HEIGHT = Math.max(200, data.length * 38);

  return (
    <div className="widget insight-widget">
      <h2 className="widget-title">Emotional drivers of escalation</h2>
      <p className="widget-insight-caption">
        Emotions most elevated in complaint calls vs normal calls — these are early warning signals.
      </p>

      <div style={{ display: 'flex', gap: 0, width: '100%' }}>
        {/* Left chart: normal calls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--chart-1)', marginBottom: 4 }}>
            Normal calls
          </div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 4, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                reversed
                stroke="var(--text-muted)"
                fontSize={10}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload as typeof data[0];
                  return (
                    <div className="chart-tooltip">
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      <span>Normal calls: {d.nonComplaintPct}%</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDrillDown(d.nonComplaintCallIds); }}
                      >
                        View calls
                      </button>
                    </div>
                  );
                }}
              />
              <Bar dataKey="nonComplaintPct" radius={[3, 0, 0, 3]} fill="var(--chart-1)" fillOpacity={0.7} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Center: emotion labels */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          padding: '28px 8px 4px',
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
          minWidth: 80,
          lineHeight: 1.2,
        }}>
          {data.map((d) => (
            <div key={d.emotion} style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 600, color: Math.abs(d.uplift) > 5 ? 'var(--text)' : 'var(--text-muted)' }}>
                {d.name}
              </span>
            </div>
          ))}
        </div>

        {/* Right chart: complaint calls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>
            Complaint calls
          </div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 0, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="var(--text-muted)"
                fontSize={10}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload as typeof data[0];
                  return (
                    <div className="chart-tooltip">
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      <span>Complaint calls: {d.complaintPct}%</span>
                      <span style={{ color: d.uplift > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        Uplift vs normal: {d.uplift > 0 ? '+' : ''}{d.uplift}pp
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDrillDown(d.complaintCallIds); }}
                      >
                        View complaint calls
                      </button>
                    </div>
                  );
                }}
              />
              <Bar dataKey="complaintPct" radius={[0, 3, 3, 0]} barSize={16}>
                {data.map((d, i) => (
                  <Cell key={i} fill={complaintFillFor(d)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="widget-hint">Longer bars in complaint column = emotion most predictive of escalation</p>
    </div>
  );
}
