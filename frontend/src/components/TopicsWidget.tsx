import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type TopicItem } from '../api';
import { WidgetHeading } from './WidgetHeading';
import './Widget.css';

interface TopicsWidgetProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

const COLORS = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-4)', 'var(--chart-3)'];

export function TopicsWidget({ timeRange, onDrillDown }: TopicsWidgetProps) {
  const [data, setData] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTopics(timeRange).then((r) => {
      setData(r.topics.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  const chartData = data.map((d) => ({ name: d.name, count: d.count, callIds: d.callIds }));

  if (loading) return <div className="widget widget-loading">Loading topics…</div>;

  return (
    <div className="widget">
      <WidgetHeading title="Trending topics" infoText="Most common conversation topics from member calls. Sentiment is on a 0–10 scale (5 = neutral). Click a segment or “View calls” to drill in." />
      <div className="widget-chart" onClick={() => data.length && onDrillDown(data.flatMap((d) => d.callIds))}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ left: 8, right: 16, bottom: 8 }}>
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>{(payload[0].payload as { name: string }).name}</span>
                    <span>{(payload[0].payload as { count: number }).count} calls</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as { callIds: string[] }).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={8}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="widget-hint">Click bar or “View calls” to see call list</p>
    </div>
  );
}
