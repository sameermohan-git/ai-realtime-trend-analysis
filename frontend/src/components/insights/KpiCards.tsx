import { useState, useEffect } from 'react';
import { api, type TimeRange, type Kpis } from '../../api';
import './KpiCards.css';

interface KpiCardsProps {
  timeRange: TimeRange;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function KpiCards({ timeRange }: KpiCardsProps) {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getKpis(timeRange).then(setKpis).finally(() => setLoading(false));
  }, [timeRange]);

  if (loading || !kpis) return <div className="kpi-cards kpi-loading">Loading KPIs…</div>;

  return (
    <div className="kpi-cards">
      <div className="kpi-card">
        <span className="kpi-label">Total calls</span>
        <span className="kpi-value">{kpis.totalCalls.toLocaleString()}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-label">Avg handle time</span>
        <span className="kpi-value">{formatDuration(kpis.avgDurationSec)}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-label">Complaints</span>
        <span className="kpi-value">{kpis.complaintCount}</span>
        <span className="kpi-meta">{kpis.complaintRatePct}% of calls</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-label">Avg member sentiment</span>
        <span
          className={`kpi-value sentiment ${
            kpis.avgMemberSentiment < 5 ? 'low' : kpis.avgMemberSentiment < 7 ? 'mid' : 'high'
          }`}
        >
          {kpis.avgMemberSentiment.toFixed(1)} / 10
        </span>
      </div>
      <div className="kpi-card">
        <span className="kpi-label">Avg agent sentiment</span>
        <span className="kpi-value sentiment high">{kpis.avgAgentSentiment}</span>
      </div>
    </div>
  );
}
