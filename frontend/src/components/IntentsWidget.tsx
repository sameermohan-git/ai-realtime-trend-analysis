import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type IntentItem } from '../api';
import { WidgetHeading } from './WidgetHeading';
import './Widget.css';

interface IntentsWidgetProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export function IntentsWidget({ timeRange, onDrillDown }: IntentsWidgetProps) {
  const [data, setData] = useState<IntentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getIntents(timeRange).then((r) => {
      setData(r.intents.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  const chartData = data.map((d) => ({ name: d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name, count: d.count, fullName: d.name, callIds: d.callIds }));

  if (loading) return <div className="widget widget-loading">Loading intents…</div>;

  return (
    <div className="widget">
      <WidgetHeading title="Trending intents" infoText="Most common reasons (intents) members called, by volume. Click the chart or “View calls” to open specific calls." />
      <div className="widget-chart" onClick={() => data.length && onDrillDown(data.flatMap((d) => d.callIds))}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={120} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>{(payload[0].payload as { fullName: string }).fullName}</span>
                    <span>{(payload[0].payload as { count: number }).count} calls</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as { callIds: string[] }).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} minPointSize={8}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="widget-hint">Click bar or “View calls” in tooltip to drill down</p>
    </div>
  );
}
