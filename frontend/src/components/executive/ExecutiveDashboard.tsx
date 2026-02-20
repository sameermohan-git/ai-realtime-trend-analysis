import { useState, useEffect } from 'react';
import {
  api,
  type TimeRange,
  type ComplianceSummary,
  type SentimentSummary,
  type RiskSummary,
  type TrendSummary,
} from '../../api';
import { InfoIcon } from '../InfoIcon';
import './ExecutiveDashboard.css';

interface ExecutiveDashboardProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

function riskLevel(pct: number): 'low' | 'moderate' | 'high' {
  if (pct >= 15) return 'high';
  if (pct >= 5) return 'moderate';
  return 'low';
}

function scoreLevel(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 85) return 'high';
  if (score >= 70) return 'moderate';
  return 'low';
}

export function ExecutiveDashboard({ timeRange, onDrillDown }: ExecutiveDashboardProps) {
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);
  const [risk, setRisk] = useState<RiskSummary | null>(null);
  const [trend, setTrend] = useState<TrendSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const range = timeRange === '30d' ? timeRange : '30d';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getComplianceSummary(range),
      api.getSentimentSummary(range),
      api.getRiskSummary(range),
      api.getTrendSummary(range),
    ])
      .then(([c, s, r, t]) => {
        setCompliance(c);
        setSentiment(s);
        setRisk(r);
        setTrend(t);
      })
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="executive-loading">Loading executive dashboard…</div>;
  if (!compliance || !sentiment || !risk || !trend) return null;

  return (
    <div className="executive-dashboard">
      <h2 className="executive-title heading-with-info">
        Executive summary
        <InfoIcon text="High-level AI quality and compliance view for the last 30 days: compliance risk, member sentiment, escalation risk, agent performance, and emerging topic trends. Use drill-downs to open specific calls." />
      </h2>
      <p className="executive-subtitle">Board-ready AI quality monitoring. Last 30 days.</p>

      {/* 1. Compliance Risk Panel */}
      <section className="executive-panel compliance-panel">
        <h3 className="panel-title heading-with-info">
          Compliance risk exposure
          <InfoIcon text="Measures call-level compliance (e.g. authentication, disclosures, advice boundaries). Overall score is the average compliance rate; high-risk % shows calls that need review. Use “View high-risk calls” or “View calls” to drill into specific calls." />
        </h3>
        <div className="kpi-row">
          <div className="kpi-card large">
            <span className="kpi-value" data-level={scoreLevel(compliance.overallComplianceScore)}>
              {compliance.overallComplianceScore}%
            </span>
            <span className="kpi-label">Overall compliance score</span>
            <button type="button" className="kpi-drill" onClick={() => compliance.highRiskCallIds.length && onDrillDown(compliance.highRiskCallIds)}>
              View high-risk calls
            </button>
          </div>
          <div className="kpi-card">
            <span className="kpi-value" data-level={riskLevel(compliance.pctHighRiskCalls)}>
              {compliance.pctHighRiskCalls}%
            </span>
            <span className="kpi-label">High-risk calls</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-value" data-level={riskLevel(compliance.pctMissingAuthentication)}>
              {compliance.pctMissingAuthentication}%
            </span>
            <span className="kpi-label">Missing authentication</span>
            <button type="button" className="kpi-drill" onClick={() => compliance.missingAuthCallIds.length && onDrillDown(compliance.missingAuthCallIds)}>
              View calls
            </button>
          </div>
          <div className="kpi-card">
            <span className="kpi-value" data-level={riskLevel(compliance.pctAdviceBoundaryViolations)}>
              {compliance.pctAdviceBoundaryViolations}%
            </span>
            <span className="kpi-label">Advice boundary</span>
          </div>
        </div>
        {compliance.trendDaily.length > 0 && (
          <div className="panel-trend">
            <span className="trend-label">Compliance trend (last 14 days)</span>
            <div className="trend-bars">
              {compliance.trendDaily.map((d) => (
                <div key={d.date} className="trend-bar-wrap" title={`${d.date}: ${d.score}%`}>
                  <div className="trend-bar" style={{ height: `${d.score}%` }} data-level={scoreLevel(d.score)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 2. Member Sentiment Intelligence */}
      <section className="executive-panel sentiment-panel">
        <h3 className="panel-title heading-with-info">
          Member sentiment intelligence
          <InfoIcon text="Sentiment recovery = % of calls where member sentiment improved by end of call. Proactive empathy = % of calls where the agent showed proactive empathy. Top topics list shows topics that often had negative sentiment—click to view those calls." />
        </h3>
        <div className="kpi-row">
          <div className="kpi-card large">
            <span className="kpi-value" data-level={sentiment.sentimentRecoveryRatePct >= 50 ? 'high' : sentiment.sentimentRecoveryRatePct >= 30 ? 'moderate' : 'low'}>
              {sentiment.sentimentRecoveryRatePct}%
            </span>
            <span className="kpi-label">Sentiment recovery rate</span>
            <button type="button" className="kpi-drill" onClick={() => sentiment.recoveryCallIds.length && onDrillDown(sentiment.recoveryCallIds)}>
              View recovered calls
            </button>
          </div>
          <div className="kpi-card">
            <span className="kpi-value">{sentiment.avgSentimentDelta >= 0 ? '↑' : '↓'} {sentiment.avgSentimentDelta}</span>
            <span className="kpi-label">Avg sentiment delta</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-value" data-level={scoreLevel(sentiment.pctProactiveEmpathy)}>
              {sentiment.pctProactiveEmpathy}%
            </span>
            <span className="kpi-label">Proactive empathy</span>
          </div>
        </div>
        {sentiment.topTopicsNegativeSentiment.length > 0 && (
          <div className="panel-list">
            <span className="list-label">Top topics with negative sentiment</span>
            <ul>
              {sentiment.topTopicsNegativeSentiment.map((t) => (
                <li key={t.topic}>
                  <button type="button" onClick={() => onDrillDown(t.callIds)}>
                    {t.topic}
                  </button>
                  <span className="list-meta">avg {t.avgSentiment.toFixed(1)} · {t.count} calls</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 3. Risk & Escalation Monitor */}
      <section className="executive-panel risk-panel">
        <h3 className="panel-title heading-with-info">
          Risk & escalation monitor
          <InfoIcon text="Complaint and vulnerable-member flags come from AI analysis of calls. Risk by agent and by topic helps target coaching and process fixes. Green = good compliance, amber = moderate, red = high risk. Use “View” to open calls." />
        </h3>
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-value" data-level={riskLevel(risk.pctComplaintSignal)}>
              {risk.pctComplaintSignal}%
            </span>
            <span className="kpi-label">Complaint signal</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-value" data-level={riskLevel(risk.pctVulnerableMemberFlag)}>
              {risk.pctVulnerableMemberFlag}%
            </span>
            <span className="kpi-label">Vulnerable member flag</span>
          </div>
        </div>
        <div className="risk-tables">
          <div className="risk-table">
            <span className="table-label">Risk by topic</span>
            <table>
              <thead>
                <tr><th>Topic</th><th>Score</th><th>High risk</th><th></th></tr>
              </thead>
              <tbody>
                {risk.riskByTopic.slice(0, 6).map((r) => (
                  <tr key={r.topic}>
                    <td>{r.topic}</td>
                    <td><span data-level={scoreLevel(r.complianceScore)}>{r.complianceScore}%</span></td>
                    <td>{r.highRiskCount}</td>
                    <td><button type="button" onClick={() => onDrillDown(r.callIds)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="risk-table">
            <span className="table-label">Risk by agent</span>
            <table>
              <thead>
                <tr><th>Agent</th><th>Score</th><th>High risk</th><th></th></tr>
              </thead>
              <tbody>
                {risk.riskByAgent.slice(0, 6).map((r) => (
                  <tr key={r.agentId}>
                    <td>{r.agentId.replace('agent-', 'Agent ')}</td>
                    <td><span data-level={scoreLevel(r.complianceScore)}>{r.complianceScore}%</span></td>
                    <td>{r.highRiskCount}</td>
                    <td><button type="button" onClick={() => onDrillDown(r.callIds)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Agent Benchmarking (compact table) */}
      <section className="executive-panel agent-panel">
        <h3 className="panel-title heading-with-info">
          Agent benchmarking
          <InfoIcon text="Per-agent compliance score and count of high-risk calls. Use to compare performance and prioritize coaching. Click “Drill down” to open that agent’s calls." />
        </h3>
        <div className="table-wrap">
          <table className="executive-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Compliance</th>
                <th>High-risk calls</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {risk.riskByAgent.map((r) => (
                <tr key={r.agentId}>
                  <td>{r.agentId.replace('agent-', 'Agent ')}</td>
                  <td><span data-level={scoreLevel(r.complianceScore)}>{r.complianceScore}%</span></td>
                  <td>{r.highRiskCount}</td>
                  <td><button type="button" onClick={() => onDrillDown(r.callIds)}>Drill down</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Emerging Trend Intelligence */}
      <section className="executive-panel trend-panel">
        <h3 className="panel-title heading-with-info">
          Emerging trend intelligence
          <InfoIcon text="Topic volume change = week-over-week % change in call volume per topic. Rising complaint topics = topics with higher complaint rates. Low clarity = topics where “next steps” were often unclear. Click a topic to view its calls." />
        </h3>
        <div className="trend-cols">
          <div className="trend-col">
            <span className="col-label">Topic volume change (WoW)</span>
            <ul>
              {trend.topicVolumeChange.slice(0, 5).map((t) => (
                <li key={t.topic}>
                  <button type="button" onClick={() => onDrillDown(t.callIds)}>{t.topic}</button>
                  <span className={t.changePct >= 0 ? 'up' : 'down'}>{t.changePct >= 0 ? '↑' : '↓'} {Math.abs(t.changePct)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="trend-col">
            <span className="col-label">Rising complaint topics</span>
            <ul>
              {trend.risingComplaintTopics.map((t) => (
                <li key={t.topic}>
                  <button type="button" onClick={() => onDrillDown(t.callIds)}>{t.topic}</button>
                  <span className="danger">{t.complaintRatePct}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="trend-col">
            <span className="col-label">Low clarity (next steps unclear)</span>
            <ul>
              {trend.lowClarityTopics.map((t) => (
                <li key={t.topic}>
                  <button type="button" onClick={() => onDrillDown(t.callIds)}>{t.topic}</button>
                  <span>{t.unclearPct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
