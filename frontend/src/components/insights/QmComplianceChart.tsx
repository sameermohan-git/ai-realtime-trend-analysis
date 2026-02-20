import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, type TimeRange, type QmCheckResult } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface QmComplianceChartProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

function colorForRate(rate: number): string {
  if (rate >= 90) return 'var(--success)';
  if (rate >= 75) return '#b8860b';
  return 'var(--danger)';
}

export function QmComplianceChart({ timeRange, onDrillDown }: QmComplianceChartProps) {
  const [checks, setChecks] = useState<QmCheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getQmCompliance(timeRange).then((r) => {
      setChecks(r.checks);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading QM compliance…</div>;

  const data = checks.map((c) => ({
    ...c,
    name: c.label.length > 32 ? c.label.slice(0, 32) + '…' : c.label,
  }));

  return (
    <div className="widget insight-widget">
      <WidgetHeading title="Quality management compliance" infoText="Pass rate for each QM check (e.g. greeting, verification, disclosure, empathy, next steps). Click a bar to see calls that passed or failed that check." />
      <p className="widget-insight-caption">
        Pass rate by QM check. Green ≥90%, amber 75–89%, red &lt;75%. Click a bar to view failed calls.
      </p>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 48, bottom: 8 }}>
            <XAxis type="number" domain={[0, 100]} unit="%" stroke="var(--text-muted)" fontSize={10} />
            <YAxis type="category" dataKey="name" width={200} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload as QmCheckResult;
                return (
                  <div className="chart-tooltip">
                    <span style={{ fontWeight: 600 }}>{d.label}</span>
                    <span>{d.passed} / {d.total} passed ({d.ratePct}%)</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); d.callIdsFailed.length && onDrillDown(d.callIdsFailed); }}>
                      View failed calls
                    </button>
                    {d.callIdsPassed.length > 0 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); onDrillDown(d.callIdsPassed); }}>
                        View passed calls
                      </button>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="ratePct" radius={[0, 4, 4, 0]} minPointSize={8}>
              {data.map((d) => (
                <Cell
                  key={d.checkId}
                  fill={colorForRate(d.ratePct)}
                  onClick={() => d.callIdsFailed.length && onDrillDown(d.callIdsFailed)}
                  style={{ cursor: d.callIdsFailed.length ? 'pointer' : 'default' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="widget-hint">Use to find training gaps and improve call centre efficiency.</p>
    </div>
  );
}
