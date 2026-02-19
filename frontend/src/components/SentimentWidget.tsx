import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, type TimeRange, type SentimentBucket } from '../api';
import './Widget.css';

interface SentimentWidgetProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

const SENTIMENT_COLORS = ['var(--danger)', '#b8860b', 'var(--success)'];

export function SentimentWidget({ timeRange, onDrillDown }: SentimentWidgetProps) {
  const [data, setData] = useState<SentimentBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSentiment(timeRange).then((r) => {
      setData(r.sentiment);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  const chartData = data.map((d) => ({ ...d, callIds: d.callIds }));

  if (loading) return <div className="widget widget-loading">Loading sentiment…</div>;

  return (
    <div className="widget">
      <h2 className="widget-title">Member sentiment (by call)</h2>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ label, percentage }) => `${label} ${percentage}%`}
              onClick={(entry) => entry.callIds?.length && onDrillDown(entry.callIds)}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={SENTIMENT_COLORS[i % SENTIMENT_COLORS.length]} stroke="var(--bg-panel)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>{(payload[0].payload as SentimentBucket).label}</span>
                    <span>{(payload[0].payload as SentimentBucket).count} calls</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as SentimentBucket).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="widget-hint">Click segment to drill down to calls</p>
    </div>
  );
}
