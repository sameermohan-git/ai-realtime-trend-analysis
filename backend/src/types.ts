export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface TrendFilters {
  from?: string; // ISO
  to?: string;
  range?: TimeRange;
}

export interface IntentItem {
  id: string;
  name: string;
  count: number;
  trend: number; // % change
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

export interface CallSegment {
  startOffset: number;
  endOffset: number;
  topic: string;
  intent: string;
  memberSentiment: number;
  agentSentiment: number;
  emotions?: Record<string, number>;
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
