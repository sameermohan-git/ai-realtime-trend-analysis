import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, type TimeRange } from '../../api';
import '../Widget.css';

interface VolumeByDayChartProps {
  timeRange: TimeRange;
}

export function VolumeByDayChart({ timeRange }: VolumeByDayChartProps) {
  const [buckets, setBuckets] = useState<{ day: number; label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getVolumeByDay(timeRange).then((r) => {
      setBuckets(r.buckets);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading day pattern…</div>;

  return (
    <div className="widget insight-widget">
      <h2 className="widget-title">Call volume by day of week</h2>
      <p className="widget-insight-caption">Weekday vs weekend pattern.</p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buckets} margin={{ left: 8, right: 8, bottom: 8 }}>
            <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip content={({ payload }) => payload?.[0] && (
              <div className="chart-tooltip">
                <span>{(payload[0].payload as { label: string }).label}</span>
                <span>{(payload[0].payload as { count: number }).count} calls</span>
              </div>
            )} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--chart-3)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
