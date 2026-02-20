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

/** Action or follow-up captured from the call (e.g. from transcript/summary) */
export interface CallAction {
  description: string;
  category?: string;
}

/** Quality management check result (from transcript/QA review) */
export type QmCheckId =
  | 'greeting_correct'
  | 'sin_verified'
  | 'phone_verified'
  | 'identity_confirmed'
  | 'disclosure_given'
  | 'empathy_shown'
  | 'next_steps_summarized'
  | 'closing_courteous';

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
  /** Actions from call (from transcript/summary pipeline) */
  actions?: CallAction[];
  /** Quality management check results (per call) */
  qmChecks?: Partial<Record<QmCheckId, boolean>>;
  isComplaint: boolean;
  /** Executive / AI quality fields (for dashboard aggregation) */
  agentId?: string;
  /** clear | partial | unclear */
  clarityOfNextSteps?: 'clear' | 'partial' | 'unclear';
  vulnerableMemberFlag?: boolean;
  adviceBoundaryRisk?: 'none' | 'moderate' | 'high';
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
