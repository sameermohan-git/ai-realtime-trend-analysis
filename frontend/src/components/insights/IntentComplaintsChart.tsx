import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type IntentComplaintItem } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface IntentComplaintsChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function IntentComplaintsChart({ timeRange, onDrillDown }: IntentComplaintsChartProps) {
  const [intents, setIntents] = useState<IntentComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getIntentComplaints(timeRange).then((r) => {
      setIntents(r.intents.filter((i) => i.count >= 1).slice(0, 10));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading intent complaints…</div>;

  const data = intents.map((i) => ({ ...i, name: i.intent.length > 20 ? i.intent.slice(0, 20) + '…' : i.intent }));

  return (
    <div className="widget insight-widget">
      <WidgetHeading title="Complaint rate by intent" infoText="Percentage of calls with a complaint signal, by intent. Highlights intents that may need process or training focus." />
      <p className="widget-insight-caption">Which intents drive the most complaints (%).</p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" unit="%" domain={[0, 'auto']} stroke="var(--text-muted)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={120} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>{(payload[0].payload as IntentComplaintItem).intent}</span>
                    <span>Complaint rate: {(payload[0].payload as IntentComplaintItem).complaintRatePct}%</span>
                    <span>{(payload[0].payload as IntentComplaintItem).complaints} / {(payload[0].payload as IntentComplaintItem).count} calls</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as IntentComplaintItem).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Bar dataKey="complaintRatePct" radius={[0, 4, 4, 0]} minPointSize={8} fill="var(--danger)">
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? 'var(--danger)' : 'var(--chart-4)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
