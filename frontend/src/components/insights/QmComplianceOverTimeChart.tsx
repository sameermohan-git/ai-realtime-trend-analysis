import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, type TimeRange, type QmComplianceOverTimeBucket } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface QmComplianceOverTimeChartProps {
  timeRange: TimeRange;
}

const CHECK_COLORS: Record<string, string> = {
  greeting_correct: 'var(--chart-1)',
  sin_verified: 'var(--chart-2)',
  phone_verified: 'var(--chart-3)',
  identity_confirmed: 'var(--chart-4)',
  disclosure_given: '#3fb950',
  empathy_shown: '#f0883e',
  next_steps_summarized: '#e85d5d',
  closing_courteous: '#58a6ff',
};

const CHECK_LABELS: Record<string, string> = {
  greeting_correct: 'Greeting',
  sin_verified: 'SIN verified',
  phone_verified: 'Phone verified',
  identity_confirmed: 'Identity',
  disclosure_given: 'Disclosure',
  empathy_shown: 'Empathy',
  next_steps_summarized: 'Next steps',
  closing_courteous: 'Closing',
};

export function QmComplianceOverTimeChart({ timeRange }: QmComplianceOverTimeChartProps) {
  const [buckets, setBuckets] = useState<QmComplianceOverTimeBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getQmComplianceOverTime(timeRange).then((r) => {
      setBuckets(r.buckets);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading QM trend…</div>;

  const data = buckets.map((b) => {
    const point: Record<string, string | number> = { label: b.label, overall: b.overallRatePct };
    b.byCheck.forEach(({ checkId, ratePct }) => {
      point[checkId] = ratePct;
    });
    return point;
  });

  const checkIds = buckets[0]?.byCheck.map((x) => x.checkId) ?? [];

  return (
    <div className="widget insight-widget">
      <WidgetHeading title="QM compliance over time" infoText="Overall QM compliance rate over time. Use to track improvement and spot drops." />
      <p className="widget-insight-caption">
        Pass rate trend by check. Spot dips and focus coaching.
      </p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
            <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} />
            <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value: number) => `${value}%`}
              labelFormatter={(label) => `Period: ${label}`}
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(key) => CHECK_LABELS[key] ?? key} />
            <Line type="monotone" dataKey="overall" name="Overall" stroke="var(--text)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
            {checkIds.slice(0, 5).map((checkId) => (
              <Line
                key={checkId}
                type="monotone"
                dataKey={checkId}
                name={checkId}
                stroke={CHECK_COLORS[checkId] ?? 'var(--chart-1)'}
                strokeWidth={1.5}
                dot={{ r: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="widget-hint">Overall (dashed) and selected checks. Add more in code if needed.</p>
    </div>
  );
}
