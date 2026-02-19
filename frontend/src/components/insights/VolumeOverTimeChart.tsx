import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, type TimeRange, type VolumeOverTimeBucket } from '../../api';
import '../Widget.css';

interface VolumeOverTimeChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function VolumeOverTimeChart({ timeRange, onDrillDown }: VolumeOverTimeChartProps) {
  const [buckets, setBuckets] = useState<VolumeOverTimeBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getVolumeOverTime(timeRange).then((r) => {
      setBuckets(r.buckets);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading volume trend…</div>;

  const data = buckets.map((b) => ({
    ...b,
    name: b.label,
  }));

  return (
    <div className="widget insight-widget">
      <h2 className="widget-title">Call volume & complaints over time</h2>
      <p className="widget-insight-caption">Spot spikes in volume and complaint concentration.</p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ left: 8, right: 32, bottom: 8 }}>
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
            <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={11} />
            <Tooltip
              content={({ payload }) =>
                payload?.[0] && (
                  <div className="chart-tooltip">
                    <span>{(payload[0].payload as VolumeOverTimeBucket).label}</span>
                    <span>Calls: {(payload[0].payload as VolumeOverTimeBucket).count}</span>
                    <span>Complaints: {(payload[0].payload as VolumeOverTimeBucket).complaints}</span>
                    <span>Avg sentiment: {(payload[0].payload as VolumeOverTimeBucket).avgMemberSentiment}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown((payload[0].payload as VolumeOverTimeBucket).callIds); }}>View calls</button>
                  </div>
                )
              }
            />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="count" name="Calls" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.4} />
            <Area yAxisId="right" type="monotone" dataKey="complaints" name="Complaints" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
