const API = '/api';

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface IntentItem {
  id: string;
  name: string;
  count: number;
  trend: number;
  callIds: string[];
}

export interface TopicItem {
  id: string;
  name: string;
  count: number;
  trend: number;
  callIds: string[];
}

export interface SentimentBucket {
  label: string;
  count: number;
  percentage: number;
  callIds: string[];
}

export interface CallSegment {
  startOffset: number;
  endOffset: number;
  topic: string;
  intent: string;
  memberSentiment: number;
  agentSentiment: number;
  emotions?: Record<string, number>;
}

export interface CallSummary {
  id: string;
  externalId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  memberSentiment: number;
  agentSentiment: number;
  primaryIntent: string;
  primaryTopic: string;
  segments: CallSegment[];
  summary?: string;
  isComplaint: boolean;
}

export interface AlertsResponse {
  complaintsElevated: boolean;
  complaintCount: number;
  threshold: number;
  windowMinutes: number;
  message?: string;
}

export interface CopilotChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  dataKey: string;
  groupBy?: string;
  metric: 'intents' | 'topics' | 'sentiment' | 'calls';
}

export interface VolumeOverTimeBucket {
  label: string;
  count: number;
  complaints: number;
  avgMemberSentiment: number;
  callIds: string[];
}

export interface TopicSentimentItem {
  topic: string;
  count: number;
  avgMemberSentiment: number;
  callIds: string[];
}

export interface IntentComplaintItem {
  intent: string;
  count: number;
  complaints: number;
  complaintRatePct: number;
  callIds: string[];
}

export interface VolumeByHourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface VolumeByDayBucket {
  day: number;
  label: string;
  count: number;
}

export interface Kpis {
  totalCalls: number;
  avgDurationSec: number;
  complaintCount: number;
  complaintRatePct: number;
  avgMemberSentiment: number;
  avgAgentSentiment: number;
}

export interface MemberAgentSentimentPoint {
  memberSentiment: number;
  agentSentiment: number;
  count: number;
  callIds: string[];
}

// C-suite: Member Journey & Impact
export interface NeedCategoryItem {
  category: string;
  count: number;
  percentage: number;
  avgMemberSentiment: number;
  callIds: string[];
}

export interface SentimentArcItem {
  intent: string;
  count: number;
  openingSentiment: number;
  closingSentiment: number;
  delta: number;
  callIds: string[];
}

export interface HeatmapCell {
  topic: string;
  intent: string;
  count: number;
  avgMemberSentiment: number;
  callIds: string[];
}

export interface EmotionProfileItem {
  emotion: string;
  complaintAvg: number;
  nonComplaintAvg: number;
  complaintCallIds: string[];
  nonComplaintCallIds: string[];
}

export interface HandleTimeSentimentItem {
  intent: string;
  count: number;
  avgHandleTimeSec: number;
  avgMemberSentiment: number;
  complaintRatePct: number;
  callIds: string[];
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  getIntents: (range: TimeRange) =>
    get<{ intents: IntentItem[]; totalCalls: number }>(`${API}/trends/intents`, { range }),

  getTopics: (range: TimeRange) =>
    get<{ topics: TopicItem[]; totalCalls: number }>(`${API}/trends/topics`, { range }),

  getSentiment: (range: TimeRange) =>
    get<{ sentiment: SentimentBucket[]; totalCalls: number }>(`${API}/trends/sentiment`, { range }),

  getCalls: (range: TimeRange, opts?: { intent?: string; topic?: string; complaints?: boolean; limit?: number }) => {
    const params: Record<string, string> = { range };
    if (opts?.intent) params.intent = opts.intent;
    if (opts?.topic) params.topic = opts.topic;
    if (opts?.complaints) params.complaints = 'true';
    if (opts?.limit) params.limit = String(opts.limit);
    return get<{ calls: CallSummary[] }>(`${API}/calls`, params);
  },

  getCall: (id: string) => get<CallSummary>(`${API}/calls/${id}`),

  getComplaintAlerts: () => get<AlertsResponse>(`${API}/alerts/complaints`),

  getVolumeOverTime: (range: TimeRange) =>
    get<{ buckets: VolumeOverTimeBucket[] }>(`${API}/insights/volume-over-time`, { range }),

  getTopicSentiment: (range: TimeRange) =>
    get<{ topics: TopicSentimentItem[] }>(`${API}/insights/topic-sentiment`, { range }),

  getIntentComplaints: (range: TimeRange) =>
    get<{ intents: IntentComplaintItem[] }>(`${API}/insights/intent-complaints`, { range }),

  getVolumeByHour: (range: TimeRange) =>
    get<{ buckets: VolumeByHourBucket[] }>(`${API}/insights/volume-by-hour`, { range }),

  getVolumeByDay: (range: TimeRange) =>
    get<{ buckets: VolumeByDayBucket[] }>(`${API}/insights/volume-by-day`, { range }),

  getKpis: (range: TimeRange) => get<Kpis>(`${API}/insights/kpis`, { range }),

  getMemberAgentSentiment: (range: TimeRange) =>
    get<{ data: MemberAgentSentimentPoint[] }>(`${API}/insights/member-agent-sentiment`, { range }),

  copilotVisualization: (query: string) =>
    post<{ config: CopilotChartConfig; message: string }>(`${API}/copilot/visualization`, { query }),

  // C-suite: Member Journey & Impact
  getNeedCategories: (range: TimeRange) =>
    get<{ categories: NeedCategoryItem[] }>(`${API}/insights/need-categories`, { range }),

  getSentimentArc: (range: TimeRange) =>
    get<{ arcs: SentimentArcItem[] }>(`${API}/insights/sentiment-arc`, { range }),

  getOutcomeHeatmap: (range: TimeRange) =>
    get<{ topics: string[]; intents: string[]; cells: HeatmapCell[] }>(`${API}/insights/outcome-heatmap`, { range }),

  getEmotionProfile: (range: TimeRange) =>
    get<{ emotions: EmotionProfileItem[] }>(`${API}/insights/emotion-profile`, { range }),

  getHandleTimeSentiment: (range: TimeRange) =>
    get<{ intents: HandleTimeSentimentItem[]; avgHandleTimeSec: number; avgMemberSentiment: number }>(
      `${API}/insights/handle-time-sentiment`,
      { range }
    ),
};
