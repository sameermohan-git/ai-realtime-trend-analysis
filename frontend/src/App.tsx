import { useState, useEffect, useCallback } from 'react';
import { api, type TimeRange, type AlertsResponse, type CopilotChartConfig } from './api';
import { DashboardHeader, type Theme } from './components/DashboardHeader';
import { DashboardSidebar, type NavItem } from './components/DashboardSidebar';
import { AlertBanner } from './components/AlertBanner';
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
import { ActionsByTopicWidget } from './components/insights/ActionsByTopicWidget';
import { TalkingPointsView } from './components/insights/TalkingPointsView';
import { QmComplianceChart } from './components/insights/QmComplianceChart';
import { QmComplianceOverTimeChart } from './components/insights/QmComplianceOverTimeChart';
import { ExecutiveDashboard } from './components/executive/ExecutiveDashboard';
import { CallDetailDrawer } from './components/CallDetailDrawer';
import { CopilotChat } from './components/CopilotChat';
import { CustomCharts } from './components/CustomCharts';
import { SectionHeading } from './components/SectionHeading';
import './App.css';

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { id: 'executive', label: 'Executive', icon: 'executive', sectionId: 'section-executive' },
  { id: 'kpis', label: 'KPIs', icon: 'kpis', sectionId: 'section-kpis' },
  { id: 'trends', label: 'Trends', icon: 'trends', sectionId: 'section-trends' },
  { id: 'insights', label: 'Insights & patterns', icon: 'insights', sectionId: 'section-insights' },
  { id: 'journey', label: 'Member journey', icon: 'journey', sectionId: 'section-journey' },
  { id: 'talking', label: 'What people are talking about', icon: 'talking', sectionId: 'section-talking' },
  { id: 'actions', label: 'Actions by topic', icon: 'actions', sectionId: 'section-actions' },
  { id: 'qm', label: 'Quality management', icon: 'qm', sectionId: 'section-qm' },
  { id: 'custom', label: 'Your visualizations', icon: 'custom', sectionId: 'section-custom' },
];

const THEME_STORAGE_KEY = 'dashboard-theme';

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return (stored === 'light' || stored === 'dark') ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [customCharts, setCustomCharts] = useState<CopilotChartConfig[]>([]);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

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

  const navItems =
    customCharts.length > 0
      ? SIDEBAR_NAV_ITEMS
      : SIDEBAR_NAV_ITEMS.filter((i) => i.id !== 'custom');

  return (
    <div className="app">
      <DashboardHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} theme={theme} onThemeChange={setTheme} />

      {alerts?.complaintsElevated && (
        <AlertBanner
          message={alerts.message!}
          count={alerts.complaintCount}
          threshold={alerts.threshold}
          onDismiss={() => setAlerts((a) => (a ? { ...a, complaintsElevated: false } : null))}
        />
      )}

      <div className="app-body">
        <DashboardSidebar
          navItems={navItems}
          onChatOpen={() => setCopilotOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="dashboard">
          <section id="section-executive" className="executive-section">
            <ExecutiveDashboard timeRange={timeRange} onDrillDown={handleDrillDown} />
          </section>

          <section id="section-kpis" className="insights-kpis">
            <KpiCards timeRange={timeRange} />
          </section>

          <section id="section-trends" className="widgets">
            <SectionHeading
              title="Trends"
              infoText="Top-level view of what members are calling about (intents and topics) and how they feel (sentiment). Use the charts to spot spikes and drill into calls."
            />
            <div className="widgets-grid">
              <IntentsWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
              <TopicsWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
              <SentimentWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
            </div>
          </section>

          <section id="section-insights" className="insights-section">
            <SectionHeading
              title="Insights & patterns"
              infoText="Call volume over time, sentiment by topic, complaint rates by intent, and volume by hour/day. Helps identify patterns and peak times."
            />
            <div className="insights-grid">
              <VolumeOverTimeChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <TopicSentimentChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <IntentComplaintsChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <VolumeByHourChart timeRange={timeRange} />
              <VolumeByDayChart timeRange={timeRange} />
              <MemberAgentSentimentChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            </div>
          </section>

          <section id="section-journey" className="journey-section">
            <SectionHeading
              title="Member journey & impact"
              infoText="Why members contact (need categories), whether sentiment improved during the call (sentiment arc), efficiency vs satisfaction, emotional drivers, and outcome heatmaps by topic × intent."
            />
            <div className="insights-grid">
              <NeedCategoryChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <SentimentArcChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <HandleTimeSentimentChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <EmotionProfileChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <OutcomeHeatmapChart timeRange={timeRange} onDrillDown={handleDrillDown} />
            </div>
          </section>

          <section id="section-talking" className="talking-section">
            <SectionHeading
              title="What people are talking about"
              infoText="Top topics and intents from member calls—a C-level view of what’s driving conversations. Click a topic or intent to see related calls."
            />
            <p className="section-subtitle">C-level view: top conversation drivers from member calls.</p>
            <div className="insights-grid">
              <TalkingPointsView timeRange={timeRange} onDrillDown={handleDrillDown} />
            </div>
          </section>

          <section id="section-actions" className="actions-section">
            <SectionHeading
              title="Actions from calls (by topic)"
              infoText="Follow-up actions derived from call summaries, grouped by topic. Shows what members and agents need to do next after calls."
            />
            <p className="section-subtitle">Follow-up actions from call summaries, mapped to topics.</p>
            <div className="insights-grid">
              <ActionsByTopicWidget timeRange={timeRange} onDrillDown={handleDrillDown} />
            </div>
          </section>

          <section id="section-qm" className="qm-section">
            <SectionHeading
              title="Quality management"
              infoText="QM compliance by check (e.g. greeting, verification, disclosure, empathy, next steps) and over time. Use to find training gaps and improve call centre efficiency."
            />
            <p className="section-subtitle">QM compliance by check and over time — find gaps and improve efficiency.</p>
            <div className="insights-grid">
              <QmComplianceChart timeRange={timeRange} onDrillDown={handleDrillDown} />
              <QmComplianceOverTimeChart timeRange={timeRange} />
            </div>
          </section>

          {customCharts.length > 0 && (
            <section id="section-custom" className="custom-section">
              <SectionHeading
                title="Your visualizations"
                infoText="Charts created via Copilot from natural language. Data comes from the same API as the rest of the dashboard."
              />
              <CustomCharts
                configs={customCharts}
                timeRange={timeRange}
                onRemove={(id) => setCustomCharts((c) => c.filter((x) => x.id !== id))}
                onDrillDown={handleDrillDown}
              />
            </section>
          )}
        </main>
      </div>

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
