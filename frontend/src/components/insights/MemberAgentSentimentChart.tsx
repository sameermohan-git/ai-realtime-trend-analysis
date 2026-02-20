import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type MemberAgentSentimentPoint } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface MemberAgentSentimentChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function MemberAgentSentimentChart({ timeRange, onDrillDown }: MemberAgentSentimentChartProps) {
  const [data, setData] = useState<MemberAgentSentimentPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMemberAgentSentiment(timeRange).then((r) => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading member vs agent…</div>;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="widget insight-widget">
      <WidgetHeading title="Member vs agent sentiment" infoText="Average member and agent sentiment by intent (0–10). Shows alignment and where member sentiment lags." />
      <p className="widget-insight-caption">Bubble size = # of calls. Bottom-left = both low; top-right = both positive.</p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ left: 8, right: 8, bottom: 8 }}>
            <XAxis
              type="number"
              dataKey="memberSentiment"
              name="Member"
              domain={[0, 10]}
              stroke="var(--text-muted)"
              fontSize={11}
            />
            <YAxis
              type="number"
              dataKey="agentSentiment"
              name="Agent"
              domain={[0, 10]}
              stroke="var(--text-muted)"
              fontSize={11}
            />
            <ZAxis type="number" dataKey="count" range={[80, 800]} />
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>Member avg: {(payload[0].payload as MemberAgentSentimentPoint).memberSentiment}</span>
                    <span>Agent avg: {(payload[0].payload as MemberAgentSentimentPoint).agentSentiment}</span>
                    <span>{(payload[0].payload as MemberAgentSentimentPoint).count} calls</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as MemberAgentSentimentPoint).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Scatter data={data} fill="var(--chart-1)">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  // Sentiment is on 0–10 scale where 5 is neutral
                  fill={entry.memberSentiment < 5 ? 'var(--danger)' : entry.memberSentiment < 7 ? '#b8860b' : 'var(--success)'}
                  fillOpacity={0.6 + (entry.count / maxCount) * 0.4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
