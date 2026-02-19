import { useState, useEffect, useCallback } from 'react';
import { api, type TimeRange, type AlertsResponse, type CopilotChartConfig } from './api';
import { AlertBanner } from './components/AlertBanner';
import { TimeFilter } from './components/TimeFilter';
import { IntentsWidget } from './components/IntentsWidget';
import { TopicsWidget } from './components/TopicsWidget';
import { SentimentWidget } from './components/SentimentWidget';
import { KpiCards } from './components/insights/KpiCards';
import { VolumeOverTimeChart } from './components/insights/VolumeOverTimeChart';
import { TopicSentimentChart } from './components/insights/TopicSentimentChart';
import { IntentComplaintsChart } from './components/insights/IntentComplaintsChart';
import { VolumeByHourChart } from './components/insights/VolumeByHourChart';
import { VolumeByDayChart } from './components/insights/VolumeByDayChart';
import { MemberAgentSentimentChart } from './components/insights/MemberAgentSentimentChart';
import { NeedCategoryChart } from './components/insights/NeedCategoryChart';
import { SentimentArcChart } from './components/insights/SentimentArcChart';
import { HandleTimeSentimentChart } from './components/insights/HandleTimeSentimentChart';
import { EmotionProfileChart } from './components/insights/EmotionProfileChart';
import { OutcomeHeatmapChart } from './components/insights/OutcomeHeatmapChart';
import { CallDetailDrawer } from './components/CallDetailDrawer';
import { CopilotChat } from './components/CopilotChat';
import { CustomCharts } from './components/CustomCharts';
import './App.css';

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [customCharts, setCustomCharts] = useState<CopilotChartConfig[]>([]);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.getComplaintAlerts();
      setAlerts(data);
    } catch {
      setAlerts(null);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 60000);
    return () => clearInterval(t);
  }, [fetchAlerts]);

  const handleDrillDown = (callIds: string[]) => {
    if (callIds.length) setSelectedCallId(callIds[0]);
  };

  const handleAddVisualization = (config: CopilotChartConfig) => {
    setCustomCharts((prev) => [...prev.filter((c) => c.id !== config.id), config]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">◉</span>
          <h1>OMERS Pensions</h1>
          <span className="brand-sub">Contact Centre — Real-time Trend Analysis</span>
        </div>
        <TimeFilter value={timeRange} onChange={setTimeRange} />
        <button
          type="button"
          className="copilot-trigger"
          onClick={() => setCopilotOpen((o) => !o)}
          aria-label="Open Copilot"
        >
          Add visualization
        </button>
      </header>

      {alerts?.complaintsElevated && (
        <AlertBanner
          message={alerts.message!}
          count={alerts.complaintCount}
          threshold={alerts.threshold}
          onDismiss={() => setAlerts((a) => (a ? { ...a, complaintsElevated: false } : null))}
        />
      )}

      <main className="dashboard">
        <section className="insights-kpis">
          <KpiCards timeRange={timeRange} />
        </section>

        <section className="widgets">
          <IntentsWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
          <TopicsWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
          <SentimentWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
        </section>

        <section className="insights-section">
          <h2 className="section-title">Insights & patterns</h2>
          <div className="insights-grid">
            <VolumeOverTimeChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <TopicSentimentChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <IntentComplaintsChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <VolumeByHourChart timeRange={timeRange} />
            <VolumeByDayChart timeRange={timeRange} />
            <MemberAgentSentimentChart timeRange={timeRange} onDrillDown={handleDrillDown} />
          </div>
        </section>

        <section className="journey-section">
          <h2 className="section-title">Member journey &amp; impact</h2>
          <div className="insights-grid">
            <NeedCategoryChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <SentimentArcChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <HandleTimeSentimentChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <EmotionProfileChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            <OutcomeHeatmapChart timeRange={timeRange} onDrillDown={handleDrillDown} />
          </div>
        </section>

        {customCharts.length > 0 && (
          <section className="custom-section">
            <h2 className="section-title">Your visualizations</h2>
            <CustomCharts
              configs={customCharts}
              timeRange={timeRange}
              onRemove={(id) => setCustomCharts((c) => c.filter((x) => x.id !== id))}
              onDrillDown={handleDrillDown}
            />
          </section>
        )}
      </main>

      <CallDetailDrawer
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />

      {copilotOpen && (
        <CopilotChat
          onClose={() => setCopilotOpen(false)}
          onAddVisualization={handleAddVisualization}
        />
      )}
    </div>
  );
}

export default App;
