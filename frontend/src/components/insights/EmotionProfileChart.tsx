import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type EmotionProfileItem } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
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

  const ROW_HEIGHT = 38;
  const CHART_HEIGHT = data.length * ROW_HEIGHT;
  const HEADER_STYLE: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 4,
    minHeight: 20,
    lineHeight: 1.2,
  };

  return (
    <div className="widget insight-widget">
      <WidgetHeading title="Emotional drivers of escalation" infoText="Emotion profiles for complaint vs non-complaint calls. Shows which emotions are more present when complaints occur." />
      <p className="widget-insight-caption">
        Emotions most elevated in complaint calls vs normal calls — these are early warning signals.
      </p>

      <div style={{ display: 'flex', gap: 0, width: '100%', alignItems: 'flex-start' }}>
        {/* Left chart: normal calls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ ...HEADER_STYLE, color: 'var(--chart-1)' }}>Normal calls</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 4, top: 0, bottom: 0 }}
              barCategoryGap={0}
              barGap={0}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                reversed
                stroke="var(--text-muted)"
                fontSize={10}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="name" hide width={0} padding={{ top: 0, bottom: 0 }} />
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
              <Bar dataKey="nonComplaintPct" radius={[3, 0, 0, 3]} fill="var(--chart-1)" fillOpacity={0.7} barSize={Math.max(12, ROW_HEIGHT - 6)} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Center: emotion labels — same row height as charts so labels line up with bars */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 80, flexShrink: 0 }}>
          <div style={{ ...HEADER_STYLE, color: 'transparent', visibility: 'hidden' }}>Normal</div>
          <div style={{ height: CHART_HEIGHT, display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
            {data.map((d) => (
              <div
                key={d.emotion}
                style={{
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  lineHeight: 1.2,
                  color: Math.abs(d.uplift) > 5 ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Right chart: complaint calls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ ...HEADER_STYLE, color: 'var(--danger)' }}>Complaint calls</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 0, top: 0, bottom: 0 }}
              barCategoryGap={0}
              barGap={0}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="var(--text-muted)"
                fontSize={10}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="name" hide width={0} padding={{ top: 0, bottom: 0 }} />
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
              <Bar dataKey="complaintPct" radius={[0, 3, 3, 0]} barSize={Math.max(12, ROW_HEIGHT - 6)}>
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
