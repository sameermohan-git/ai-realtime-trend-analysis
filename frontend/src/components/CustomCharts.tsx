import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { api, type TimeRange, type CopilotChartConfig } from '../api';
import './Widget.css';

interface CustomChartsProps {
  configs: CopilotChartConfig[];
  timeRange: TimeRange;
  onRemove: (id: string) => void;
  onDrillDown: (callIds: string[]) => void;
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export function CustomCharts({ configs, timeRange, onRemove, onDrillDown }: CustomChartsProps) {
  return (
    <div className="custom-charts-grid">
      {configs.map((config) => (
        <CustomChartCard
          key={config.id}
          config={config}
          timeRange={timeRange}
          onRemove={() => onRemove(config.id)}
          onDrillDown={onDrillDown}
        />
      ))}
    </div>
  );
}

function CustomChartCard({
  config,
  timeRange,
  onRemove,
  onDrillDown,
}: {
  config: CopilotChartConfig;
  timeRange: TimeRange;
  onRemove: () => void;
  onDrillDown: (callIds: string[]) => void;
}) {
  const [data, setData] = useState<{ name: string; count: number; callIds?: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let next: { name: string; count: number; callIds?: string[] }[] = [];
      if (config.metric === 'intents') {
        const r = await api.getIntents(timeRange);
        const list = Array.isArray(r?.intents) ? r.intents : [];
        next = list.slice(0, 8).map((d) => ({ name: String(d?.name ?? ''), count: Number(d?.count ?? 0), callIds: d?.callIds }));
      } else if (config.metric === 'topics') {
        const r = await api.getTopics(timeRange);
        const list = Array.isArray(r?.topics) ? r.topics : [];
        next = list.slice(0, 8).map((d) => ({ name: String(d?.name ?? ''), count: Number(d?.count ?? 0), callIds: d?.callIds }));
      } else if (config.metric === 'sentiment') {
        const r = await api.getSentiment(timeRange);
        const list = Array.isArray(r?.sentiment) ? r.sentiment : [];
        next = list.map((d) => ({ name: String(d.label ?? ''), count: Number(d.count ?? 0), callIds: d.callIds }));
      } else if (config.metric === 'volume-over-time') {
        const r = await api.getVolumeOverTime(timeRange);
        const list = Array.isArray(r?.buckets) ? r.buckets : [];
        next = list.map((d) => ({ name: String(d?.label ?? ''), count: Number(d?.count ?? 0), callIds: d?.callIds }));
      } else {
        const r = await api.getCalls(timeRange, { limit: 10 });
        const calls = Array.isArray(r?.calls) ? r.calls : [];
        const byDay = new Map<string, { count: number; callIds: string[] }>();
        calls.forEach((c) => {
          const day = new Date(c.endedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
          const cur = byDay.get(day) ?? { count: 0, callIds: [] };
          cur.count++;
          cur.callIds.push(c.id);
          byDay.set(day, cur);
        });
        next = Array.from(byDay.entries()).map(([name, v]) => ({ name, count: v.count, callIds: v.callIds }));
      }
      setData(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load data';
      setError(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [config.id, config.metric, timeRange]);

  if (loading) {
    return (
      <div className="widget widget-loading">
        <button type="button" className="widget-remove" onClick={onRemove}>Remove</button>
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget custom-widget">
        <div className="widget-head-row">
          <h2 className="widget-title">{config.title}</h2>
          <button type="button" className="widget-remove" onClick={onRemove}>Remove</button>
        </div>
        <div className="widget-chart widget-chart-error">
          <p className="widget-error-text">{error}</p>
          <p className="widget-error-hint">Ensure the API is running at the same origin or proxy (e.g. npm run dev).</p>
          <button type="button" className="widget-retry" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="widget custom-widget">
        <div className="widget-head-row">
          <h2 className="widget-title">{config.title}</h2>
          <button type="button" className="widget-remove" onClick={onRemove}>Remove</button>
        </div>
        <div className="widget-chart widget-chart-empty">
          <p className="widget-empty-text">No data for the selected time range.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, name: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name }));

  const commonBar = (
    <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={6} onClick={(entry: { callIds?: string[] }) => entry?.callIds && onDrillDown(entry.callIds)}>
      {chartData.map((_, i) => (
        <Cell key={i} fill={COLORS[i % COLORS.length]} />
      ))}
    </Bar>
  );

  return (
    <div className="widget custom-widget">
      <div className="widget-head-row">
        <h2 className="widget-title">{config.title}</h2>
        <button type="button" className="widget-remove" onClick={onRemove}>Remove</button>
      </div>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={220}>
          <>
          {config.type === 'bar' && (
            <BarChart data={chartData} margin={{ left: 8, right: 8, bottom: 8 }}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip content={({ payload }) => payload?.[0] && (
                <div className="chart-tooltip">
                  <span>{(payload[0].payload as { name: string }).name}</span>
                  <span>{(payload[0].payload as { count: number }).count}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); (payload[0].payload as { callIds?: string[] }).callIds && onDrillDown((payload[0].payload as { callIds: string[] }).callIds); }}>View calls</button>
                </div>
              )} />
              {commonBar}
            </BarChart>
          )}
          {config.type === 'line' && (
            <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} dot={{ fill: 'var(--chart-1)' }} />
            </LineChart>
          )}
          {config.type === 'pie' && (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                onClick={(entry: { callIds?: string[] }) => entry?.callIds && onDrillDown(entry.callIds)}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-panel)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
          {config.type === 'area' && (
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.4} />
            </AreaChart>
          )}
          </>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
