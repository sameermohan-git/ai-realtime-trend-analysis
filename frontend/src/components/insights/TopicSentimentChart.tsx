import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type TopicSentimentItem } from '../../api';
import '../Widget.css';

interface TopicSentimentChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function TopicSentimentChart({ timeRange, onDrillDown }: TopicSentimentChartProps) {
  const [topics, setTopics] = useState<TopicSentimentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTopicSentiment(timeRange).then((r) => {
      setTopics(r.topics);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading topic sentiment…</div>;

  const data = topics.map((t) => ({ ...t, name: t.topic.length > 18 ? t.topic.slice(0, 18) + '…' : t.topic }));

  const colorFor = (avg: number) =>
    avg < 40 ? 'var(--danger)' : avg < 65 ? '#b8860b' : 'var(--success)';

  return (
    <div className="widget insight-widget">
      <h2 className="widget-title">Topics by average member sentiment</h2>
      <p className="widget-insight-caption">Lower bars = riskier topics; prioritize coaching and process.</p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={110} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>{(payload[0].payload as TopicSentimentItem).topic}</span>
                    <span>Avg sentiment: {(payload[0].payload as TopicSentimentItem).avgMemberSentiment}</span>
                    <span>{(payload[0].payload as TopicSentimentItem).count} calls</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as TopicSentimentItem).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Bar dataKey="avgMemberSentiment" radius={[0, 4, 4, 0]} minPointSize={8}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorFor(d.avgMemberSentiment)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
