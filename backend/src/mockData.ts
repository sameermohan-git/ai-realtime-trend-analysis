import { v4 as uuid } from 'uuid';
import type {
  IntentItem,
  TopicItem,
  SentimentBucket,
  CallSummary,
  CallSegment,
  CallAction,
  TimeRange,
  NeedCategoryItem,
  SentimentArcItem,
  HeatmapCell,
  EmotionProfileItem,
  HandleTimeSentimentItem,
} from './types.js';
import type { QmCheckId } from './types.js';

const INTENTS = [
  'Pension balance inquiry',
  'Contribution change',
  'Benefit start date',
  'Complaint - delay',
  'Complaint - incorrect amount',
  'Address update',
  'Tax form request',
  'Retirement estimate',
  'Spouse benefit',
  'Transfer in/out',
];

const TOPICS = [
  'Account balance',
  'Contributions',
  'Benefits eligibility',
  'Complaints',
  'Personal information',
  'Tax documents',
  'Retirement planning',
  'Dependent benefits',
  'Portability',
  'Fees and charges',
];

/** Sample actions from calls (topic/intent-based) for mock */
const ACTIONS_BY_TOPIC: Record<string, string[]> = {
  'Account balance': ['Send statement by email', 'Verify last contribution', 'Schedule callback if discrepancy'],
  'Contributions': ['Update contribution rate', 'Send confirmation letter', 'Follow up with payroll'],
  'Benefits eligibility': ['Mail eligibility letter', 'Add to waitlist', 'Schedule assessment call'],
  'Complaints': ['Escalate to supervisor', 'Open case for review', 'Callback within 48h', 'Send apology letter'],
  'Personal information': ['Update address in system', 'Resend verification', 'Confirm identity docs'],
  'Tax documents': ['Send T4 by email', 'Mail T4A to address', 'Generate duplicate by Friday'],
  'Retirement planning': ['Send estimate package', 'Book advisor call', 'Email projection report'],
  'Dependent benefits': ['Add dependent to file', 'Request birth certificate', 'Update beneficiary form'],
  'Portability': ['Initiate transfer form', 'Request statement from prior plan', 'Confirm transfer timeline'],
  'Fees and charges': ['Waive fee once', 'Explain fee breakdown', 'Send fee schedule'],
};

/** QM check IDs and base pass rate (0–1) for mock — complaint calls slightly lower on empathy/closing */
const QM_CHECKS: { id: QmCheckId; basePassRate: number }[] = [
  { id: 'greeting_correct', basePassRate: 0.92 },
  { id: 'sin_verified', basePassRate: 0.88 },
  { id: 'phone_verified', basePassRate: 0.85 },
  { id: 'identity_confirmed', basePassRate: 0.87 },
  { id: 'disclosure_given', basePassRate: 0.94 },
  { id: 'empathy_shown', basePassRate: 0.82 },
  { id: 'next_steps_summarized', basePassRate: 0.79 },
  { id: 'closing_courteous', basePassRate: 0.90 },
];

const QM_LABELS: Record<QmCheckId, string> = {
  greeting_correct: 'Agent greeted member correctly',
  sin_verified: 'SIN verified',
  phone_verified: 'Phone number verified',
  identity_confirmed: 'Identity confirmed',
  disclosure_given: 'Required disclosure given',
  empathy_shown: 'Empathy shown',
  next_steps_summarized: 'Next steps summarized',
  closing_courteous: 'Courteous closing',
};

const AGENT_IDS = ['agent-001', 'agent-002', 'agent-003', 'agent-004', 'agent-005', 'agent-006'];

const EMOTIONS = ['angry', 'disappointed', 'concerned', 'neutral', 'satisfied', 'relieved'];

/** Negative emotions (elevated in complaint calls) */
const NEGATIVE_EMOTIONS = ['angry', 'disappointed', 'concerned'];
/** Positive emotions (elevated in normal calls) */
const POSITIVE_EMOTIONS = ['satisfied', 'relieved', 'neutral'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function addHours(d: Date, h: number): Date {
  const out = new Date(d);
  out.setHours(out.getHours() + h);
  return out;
}

/** Generate emotion intensities (0–1) so complaint calls show higher negative emotions and normal calls higher positive — makes Emotion Profile chart useful. */
function emotionIntensitiesForSegment(isComplaint: boolean): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of EMOTIONS) {
    const isNegative = NEGATIVE_EMOTIONS.includes(e);
    const isPositive = POSITIVE_EMOTIONS.includes(e);
    if (isComplaint) {
      if (isNegative) out[e] = 0.5 + Math.random() * 0.45;       // 0.5–0.95
      else if (isPositive) out[e] = 0.05 + Math.random() * 0.25;  // 0.05–0.3
      else out[e] = 0.2 + Math.random() * 0.3;
    } else {
      if (isPositive) out[e] = 0.5 + Math.random() * 0.45;       // 0.5–0.95
      else if (isNegative) out[e] = 0.05 + Math.random() * 0.25;  // 0.05–0.3
      else out[e] = 0.3 + Math.random() * 0.4;
    }
  }
  return out;
}

export function generateCalls(count: number, options?: { complaintBias?: number }): CallSummary[] {
  const complaintBias = options?.complaintBias ?? 0.35;
  const calls: CallSummary[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const duration = randomInt(120, 900);
    const start = addHours(now, -randomInt(0, 72));
    const end = addHours(start, duration / 3600);
    const isComplaint = Math.random() < complaintBias;
    const intent = isComplaint
      ? randomChoice(INTENTS.filter((x) => x.startsWith('Complaint')))
      : randomChoice(INTENTS.filter((x) => !x.startsWith('Complaint')));
    const topic = isComplaint ? 'Complaints' : randomChoice(TOPICS);
    // Sentiment scores on 0–10 scale where 5 is neutral
    const memberSent = isComplaint ? randomInt(0, 4) : randomInt(6, 10);
    const agentSent = isComplaint ? randomInt(4, 8) : randomInt(6, 10);

    const segmentCount = randomInt(1, 4);
    const segments: CallSegment[] = [];
    let offset = 0;
    const segLen = Math.floor(duration / segmentCount);
    for (let s = 0; s < segmentCount; s++) {
      segments.push({
        startOffset: offset,
        endOffset: offset + segLen,
        topic: s === 0 ? topic : randomChoice(TOPICS),
        intent: s === 0 ? intent : randomChoice(INTENTS),
        memberSentiment: clamp(memberSent + randomInt(-2, 2), 0, 10),
        agentSentiment: clamp(agentSent + randomInt(-2, 2), 0, 10),
        emotions: emotionIntensitiesForSegment(isComplaint),
      });
      offset += segLen;
    }

    const actionsForTopic = ACTIONS_BY_TOPIC[topic] ?? ACTIONS_BY_TOPIC['Account balance'];
    const numActions = randomInt(0, Math.min(3, actionsForTopic.length));
    const actions: CallAction[] = [];
    const used = new Set<number>();
    while (actions.length < numActions) {
      const idx = randomInt(0, actionsForTopic.length - 1);
      if (!used.has(idx)) {
        used.add(idx);
        actions.push({ description: actionsForTopic[idx], category: topic });
      }
    }

    const qmChecks: Partial<Record<QmCheckId, boolean>> = {};
    for (const { id, basePassRate } of QM_CHECKS) {
      const rate = isComplaint && (id === 'empathy_shown' || id === 'closing_courteous') ? basePassRate - 0.1 : basePassRate;
      qmChecks[id] = Math.random() < rate + (Math.random() - 0.5) * 0.1;
    }

    const clarityChoices: Array<'clear' | 'partial' | 'unclear'> = ['clear', 'clear', 'partial', 'unclear'];
    const adviceChoices: Array<'none' | 'moderate' | 'high'> = ['none', 'none', 'none', 'moderate', 'high'];

    calls.push({
      id: uuid(),
      externalId: `F9-${1000000 + i}-${Date.now().toString(36)}`,
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      durationSeconds: duration,
      memberSentiment: memberSent,
      agentSentiment: agentSent,
      primaryIntent: intent,
      primaryTopic: topic,
      segments,
      summary: `Call regarding ${topic.toLowerCase()}. Member ${isComplaint ? 'expressed frustration' : 'inquiry resolved'}.`,
      actions,
      qmChecks,
      isComplaint,
      agentId: randomChoice(AGENT_IDS),
      clarityOfNextSteps: randomChoice(clarityChoices),
      vulnerableMemberFlag: Math.random() < 0.08,
      adviceBoundaryRisk: randomChoice(adviceChoices),
    });
  }

  return calls.sort(
    (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
  );
}

let cachedCalls: CallSummary[] | null = null;

export function getCalls(from?: Date, to?: Date): CallSummary[] {
  if (!cachedCalls) {
    cachedCalls = generateCalls(165);
    // Seed last hour with extra complaints so alert banner and emotion profile chart show useful data
    const lastHour = generateCalls(35, { complaintBias: 0.85 });
    const now = Date.now();
    lastHour.forEach((c) => {
      c.startedAt = new Date(now - Math.random() * 3600 * 1000).toISOString();
      c.endedAt = new Date(now - Math.random() * 1800 * 1000).toISOString();
    });
    cachedCalls = [...lastHour, ...cachedCalls].sort(
      (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
    );
  }
  let list = cachedCalls;
  if (from) list = list.filter((c) => new Date(c.endedAt) >= from);
  if (to) list = list.filter((c) => new Date(c.endedAt) <= to);
  return list;
}

export function aggregateIntents(calls: CallSummary[]): IntentItem[] {
  const byIntent = new Map<string, { count: number; callIds: string[] }>();
  for (const c of calls) {
    const key = c.primaryIntent;
    const cur = byIntent.get(key) ?? { count: 0, callIds: [] };
    cur.count++;
    cur.callIds.push(c.id);
    byIntent.set(key, cur);
  }
  return Array.from(byIntent.entries()).map(([name, v], i) => ({
    id: `intent-${i}`,
    name,
    count: v.count,
    trend: (Math.random() - 0.4) * 30,
    callIds: v.callIds,
  })).sort((a, b) => b.count - a.count);
}

export function aggregateTopics(calls: CallSummary[]): TopicItem[] {
  const byTopic = new Map<string, { count: number; callIds: string[] }>();
  for (const c of calls) {
    const key = c.primaryTopic;
    const cur = byTopic.get(key) ?? { count: 0, callIds: [] };
    cur.count++;
    cur.callIds.push(c.id);
    byTopic.set(key, cur);
  }
  return Array.from(byTopic.entries()).map(([name, v], i) => ({
    id: `topic-${i}`,
    name,
    count: v.count,
    trend: (Math.random() - 0.4) * 25,
    callIds: v.callIds,
  })).sort((a, b) => b.count - a.count);
}

export function aggregateSentiment(calls: CallSummary[]): SentimentBucket[] {
  const buckets = [
    { label: 'Negative (0–3)', min: 0, max: 3, count: 0, callIds: [] as string[] },
    { label: 'Neutral (4–6)', min: 4, max: 6, count: 0, callIds: [] as string[] },
    { label: 'Positive (7–10)', min: 7, max: 10, count: 0, callIds: [] as string[] },
  ];
  for (const c of calls) {
    const score = c.memberSentiment;
    const b = buckets.find((x) => score >= x.min && score <= x.max);
    if (b) {
      b.count++;
      b.callIds.push(c.id);
    }
  }
  const total = calls.length;
  return buckets.map(({ label, count, callIds }) => ({
    label,
    count,
    percentage: total ? Math.round((count / total) * 100) : 0,
    callIds,
  }));
}

// --- Insights: time buckets (volume + complaints + avg sentiment)
export function getVolumeOverTime(
  calls: CallSummary[],
  range: TimeRange
): { label: string; count: number; complaints: number; avgMemberSentiment: number; callIds: string[] }[] {
  const bucketSize = range === '1h' || range === '6h' ? 'hour' : range === '24h' ? 'hour' : 'day';
  const byBucket = new Map<
    string,
    { count: number; complaints: number; sentimentSum: number; callIds: string[] }
  >();
  for (const c of calls) {
    const d = new Date(c.endedAt);
    const key =
      bucketSize === 'hour'
        ? `${d.toISOString().slice(0, 13)}:00`
        : d.toISOString().slice(0, 10);
    const cur = byBucket.get(key) ?? { count: 0, complaints: 0, sentimentSum: 0, callIds: [] };
    cur.count++;
    if (c.isComplaint) cur.complaints++;
    cur.sentimentSum += c.memberSentiment;
    cur.callIds.push(c.id);
    byBucket.set(key, cur);
  }
  const entries = Array.from(byBucket.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([label, v]) => ({
    label: bucketSize === 'hour' ? label.slice(11, 16) : label,
    count: v.count,
    complaints: v.complaints,
    avgMemberSentiment: v.count ? Math.round((v.sentimentSum / v.count) * 10) / 10 : 0,
    callIds: v.callIds,
  }));
}

// --- Insights: topic vs average member sentiment (pattern: riskiest topics)
export function getTopicSentiment(
  calls: CallSummary[]
): { topic: string; count: number; avgMemberSentiment: number; callIds: string[] }[] {
  const byTopic = new Map<string, { sum: number; count: number; callIds: string[] }>();
  for (const c of calls) {
    const cur = byTopic.get(c.primaryTopic) ?? { sum: 0, count: 0, callIds: [] };
    cur.sum += c.memberSentiment;
    cur.count++;
    cur.callIds.push(c.id);
    byTopic.set(c.primaryTopic, cur);
  }
  return Array.from(byTopic.entries())
    .map(([topic, v]) => ({
      topic,
      count: v.count,
      avgMemberSentiment: v.count ? Math.round((v.sum / v.count) * 10) / 10 : 0,
      callIds: v.callIds,
    }))
    .sort((a, b) => a.avgMemberSentiment - b.avgMemberSentiment);
}

// --- Insights: intent vs complaint count and rate
export function getIntentComplaints(
  calls: CallSummary[]
): { intent: string; count: number; complaints: number; complaintRatePct: number; callIds: string[] }[] {
  const byIntent = new Map<string, { count: number; complaints: number; callIds: string[] }>();
  for (const c of calls) {
    const cur = byIntent.get(c.primaryIntent) ?? { count: 0, complaints: 0, callIds: [] };
    cur.count++;
    if (c.isComplaint) cur.complaints++;
    cur.callIds.push(c.id);
    byIntent.set(c.primaryIntent, cur);
  }
  return Array.from(byIntent.entries())
    .map(([intent, v]) => ({
      intent,
      count: v.count,
      complaints: v.complaints,
      complaintRatePct: v.count ? Math.round((v.complaints / v.count) * 1000) / 10 : 0,
      callIds: v.callIds,
    }))
    .sort((a, b) => b.complaintRatePct - a.complaintRatePct);
}

// --- Patterns: volume by hour of day (0–23), across the range
export function getVolumeByHour(calls: CallSummary[]): { hour: number; label: string; count: number }[] {
  const byHour = new Map<number, number>();
  for (let h = 0; h < 24; h++) byHour.set(h, 0);
  for (const c of calls) {
    const h = new Date(c.endedAt).getHours();
    byHour.set(h, (byHour.get(h) ?? 0) + 1);
  }
  return Array.from(byHour.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ hour, label: `${hour}:00`, count }));
}

// --- Patterns: volume by day of week (0 Sun – 6 Sat)
export function getVolumeByDayOfWeek(calls: CallSummary[]): { day: number; label: string; count: number }[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = new Map<number, number>();
  for (let d = 0; d < 7; d++) byDay.set(d, 0);
  for (const c of calls) {
    const d = new Date(c.endedAt).getDay();
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, count]) => ({ day, label: dayNames[day], count }));
}

// --- KPIs
export function getKpis(calls: CallSummary[]): {
  totalCalls: number;
  avgDurationSec: number;
  complaintCount: number;
  complaintRatePct: number;
  avgMemberSentiment: number;
  avgAgentSentiment: number;
} {
  if (!calls.length)
    return {
      totalCalls: 0,
      avgDurationSec: 0,
      complaintCount: 0,
      complaintRatePct: 0,
      avgMemberSentiment: 0,
      avgAgentSentiment: 0,
    };
  const total = calls.length;
  const complaintCount = calls.filter((c) => c.isComplaint).length;
  const durationSum = calls.reduce((s, c) => s + c.durationSeconds, 0);
  const memberSum = calls.reduce((s, c) => s + c.memberSentiment, 0);
  const agentSum = calls.reduce((s, c) => s + c.agentSentiment, 0);
  return {
    totalCalls: total,
    avgDurationSec: Math.round(durationSum / total),
    complaintCount,
    complaintRatePct: Math.round((complaintCount / total) * 1000) / 10,
    avgMemberSentiment: Math.round((memberSum / total) * 10) / 10,
    avgAgentSentiment: Math.round((agentSum / total) * 10) / 10,
  };
}

// --- Member vs agent sentiment distribution (for scatter or buckets)
export function getMemberAgentSentiment(
  calls: CallSummary[]
): { memberSentiment: number; agentSentiment: number; count: number; callIds: string[] }[] {
  const bucket = (n: number) => {
    const clamped = clamp(n, 0, 10);
    return Math.round(clamped * 2) / 2; // bucket to 0.5-step increments on 0–10 scale
  };
  const byBucket = new Map<string, { count: number; callIds: string[] }>();
  for (const c of calls) {
    const key = `${bucket(c.memberSentiment)}-${bucket(c.agentSentiment)}`;
    const cur = byBucket.get(key) ?? { count: 0, callIds: [] };
    cur.count++;
    cur.callIds.push(c.id);
    byBucket.set(key, cur);
  }
  return Array.from(byBucket.entries()).map(([key, v]) => {
    const [m, a] = key.split('-').map(Number);
    return { memberSentiment: m, agentSentiment: a, count: v.count, callIds: v.callIds };
  });
}

// --- C-suite: Need category breakdown (why members call, 3 strategic buckets)
const NEED_CATEGORY_MAP: Record<string, string> = {
  'Address update': 'Routine admin',
  'Tax form request': 'Routine admin',
  'Pension balance inquiry': 'Benefit decision',
  'Benefit start date': 'Benefit decision',
  'Retirement estimate': 'Benefit decision',
  'Spouse benefit': 'Benefit decision',
  'Contribution change': 'Benefit decision',
  'Transfer in/out': 'Benefit decision',
  'Complaint - delay': 'Service failure',
  'Complaint - incorrect amount': 'Service failure',
};

export function getNeedCategories(calls: CallSummary[]): NeedCategoryItem[] {
  const buckets = new Map<string, { count: number; sentimentSum: number; callIds: string[] }>();
  for (const c of calls) {
    const cat = NEED_CATEGORY_MAP[c.primaryIntent] ?? 'Other';
    const cur = buckets.get(cat) ?? { count: 0, sentimentSum: 0, callIds: [] };
    cur.count++;
    cur.sentimentSum += c.memberSentiment;
    cur.callIds.push(c.id);
    buckets.set(cat, cur);
  }
  const total = calls.length || 1;
  const order = ['Benefit decision', 'Routine admin', 'Service failure', 'Other'];
  return order
    .filter((cat) => buckets.has(cat))
    .map((cat) => {
      const v = buckets.get(cat)!;
      return {
        category: cat,
        count: v.count,
        percentage: Math.round((v.count / total) * 1000) / 10,
        avgMemberSentiment: v.count ? Math.round((v.sentimentSum / v.count) * 10) / 10 : 0,
        callIds: v.callIds,
      };
    });
}

// --- C-suite: Sentiment arc — does member sentiment improve or worsen within each call?
export function getSentimentArc(calls: CallSummary[]): SentimentArcItem[] {
  const byIntent = new Map<
    string,
    { openSum: number; closeSum: number; count: number; callIds: string[] }
  >();
  for (const c of calls) {
    if (!c.segments.length) continue;
    const sorted = [...c.segments].sort((a, b) => a.startOffset - b.startOffset);
    const open = sorted[0].memberSentiment;
    const close = sorted[sorted.length - 1].memberSentiment;
    const cur = byIntent.get(c.primaryIntent) ?? { openSum: 0, closeSum: 0, count: 0, callIds: [] };
    cur.openSum += open;
    cur.closeSum += close;
    cur.count++;
    cur.callIds.push(c.id);
    byIntent.set(c.primaryIntent, cur);
  }
  return Array.from(byIntent.entries())
    .map(([intent, v]) => {
      const openingSentiment = Math.round((v.openSum / v.count) * 10) / 10;
      const closingSentiment = Math.round((v.closeSum / v.count) * 10) / 10;
      return {
        intent,
        count: v.count,
        openingSentiment,
        closingSentiment,
        delta: Math.round((closingSentiment - openingSentiment) * 10) / 10,
        callIds: v.callIds,
      };
    })
    .sort((a, b) => a.delta - b.delta); // worst deterioration first
}

// --- C-suite: Outcome heatmap — top 5 topics × top 5 intents, avg member sentiment per cell
export function getOutcomeHeatmap(
  calls: CallSummary[]
): { topics: string[]; intents: string[]; cells: HeatmapCell[] } {
  // Determine top 5 topics and top 5 intents by volume
  const topicCounts = new Map<string, number>();
  const intentCounts = new Map<string, number>();
  for (const c of calls) {
    topicCounts.set(c.primaryTopic, (topicCounts.get(c.primaryTopic) ?? 0) + 1);
    intentCounts.set(c.primaryIntent, (intentCounts.get(c.primaryIntent) ?? 0) + 1);
  }
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  const topIntents = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([i]) => i);

  const topicSet = new Set(topTopics);
  const intentSet = new Set(topIntents);
  const cellMap = new Map<string, { count: number; sentimentSum: number; callIds: string[] }>();

  for (const c of calls) {
    if (!topicSet.has(c.primaryTopic) || !intentSet.has(c.primaryIntent)) continue;
    const key = `${c.primaryTopic}||${c.primaryIntent}`;
    const cur = cellMap.get(key) ?? { count: 0, sentimentSum: 0, callIds: [] };
    cur.count++;
    cur.sentimentSum += c.memberSentiment;
    cur.callIds.push(c.id);
    cellMap.set(key, cur);
  }

  const cells: HeatmapCell[] = Array.from(cellMap.entries()).map(([key, v]) => {
    const [topic, intent] = key.split('||');
    return {
      topic,
      intent,
      count: v.count,
      avgMemberSentiment: v.count ? Math.round((v.sentimentSum / v.count) * 10) / 10 : 0,
      callIds: v.callIds,
    };
  });

  return { topics: topTopics, intents: topIntents, cells };
}

// --- C-suite: Emotion profile — avg emotion intensity in complaint vs non-complaint calls
export function getEmotionProfile(calls: CallSummary[]): EmotionProfileItem[] {
  const complaintMap = new Map<string, { sum: number; count: number; callIds: Set<string> }>();
  const nonComplaintMap = new Map<string, { sum: number; count: number; callIds: Set<string> }>();

  for (const c of calls) {
    const target = c.isComplaint ? complaintMap : nonComplaintMap;
    for (const seg of c.segments) {
      if (!seg.emotions) continue;
      for (const [emotion, value] of Object.entries(seg.emotions)) {
        const cur = target.get(emotion) ?? { sum: 0, count: 0, callIds: new Set() };
        cur.sum += value;
        cur.count++;
        cur.callIds.add(c.id);
        target.set(emotion, cur);
      }
    }
  }

  const allEmotions = new Set([...complaintMap.keys(), ...nonComplaintMap.keys()]);
  return Array.from(allEmotions)
    .map((emotion) => {
      const c = complaintMap.get(emotion) ?? { sum: 0, count: 1, callIds: new Set<string>() };
      const n = nonComplaintMap.get(emotion) ?? { sum: 0, count: 1, callIds: new Set<string>() };
      const complaintAvg = Math.round((c.sum / c.count) * 1000) / 1000;
      const nonComplaintAvg = Math.round((n.sum / n.count) * 1000) / 1000;
      return {
        emotion,
        complaintAvg,
        nonComplaintAvg,
        complaintCallIds: Array.from(c.callIds),
        nonComplaintCallIds: Array.from(n.callIds),
      };
    })
    .sort((a, b) => (b.complaintAvg - b.nonComplaintAvg) - (a.complaintAvg - a.nonComplaintAvg));
}

// --- C-suite: Handle time vs satisfaction frontier — per intent bubble data
export function getHandleTimeSentiment(
  calls: CallSummary[]
): { intents: HandleTimeSentimentItem[]; avgHandleTimeSec: number; avgMemberSentiment: number } {
  const byIntent = new Map<
    string,
    { durationSum: number; sentimentSum: number; count: number; complaints: number; callIds: string[] }
  >();
  for (const c of calls) {
    const cur = byIntent.get(c.primaryIntent) ?? {
      durationSum: 0,
      sentimentSum: 0,
      count: 0,
      complaints: 0,
      callIds: [],
    };
    cur.durationSum += c.durationSeconds;
    cur.sentimentSum += c.memberSentiment;
    cur.count++;
    if (c.isComplaint) cur.complaints++;
    cur.callIds.push(c.id);
    byIntent.set(c.primaryIntent, cur);
  }

  const intents: HandleTimeSentimentItem[] = Array.from(byIntent.entries()).map(([intent, v]) => ({
    intent,
    count: v.count,
    avgHandleTimeSec: Math.round(v.durationSum / v.count),
    avgMemberSentiment: Math.round((v.sentimentSum / v.count) * 10) / 10,
    complaintRatePct: Math.round((v.complaints / v.count) * 1000) / 10,
    callIds: v.callIds,
  }));

  const total = calls.length || 1;
  const avgHandleTimeSec = Math.round(
    calls.reduce((s, c) => s + c.durationSeconds, 0) / total
  );
  const avgMemberSentiment = Math.round(
    (calls.reduce((s, c) => s + c.memberSentiment, 0) / total) * 10
  ) / 10;

  return { intents, avgHandleTimeSec, avgMemberSentiment };
}

// --- Actions from calls, grouped by topic (for dashboard: actions mapped to topics)
export interface ActionByTopicItem {
  topic: string;
  actions: { action: string; count: number; callIds: string[] }[];
}

export function getActionsByTopic(calls: CallSummary[]): ActionByTopicItem[] {
  const byTopic = new Map<string, Map<string, { count: number; callIds: string[] }>>();
  for (const c of calls) {
    const topic = c.primaryTopic;
    const actions = c.actions ?? [];
    for (const a of actions) {
      const desc = a.description;
      if (!byTopic.has(topic)) byTopic.set(topic, new Map());
      const actionMap = byTopic.get(topic)!;
      const cur = actionMap.get(desc) ?? { count: 0, callIds: [] };
      cur.count++;
      cur.callIds.push(c.id);
      actionMap.set(desc, cur);
    }
  }
  return Array.from(byTopic.entries())
    .map(([topic, actionMap]) => ({
      topic,
      actions: Array.from(actionMap.entries())
        .map(([action, v]) => ({ action, count: v.count, callIds: v.callIds }))
        .sort((a, b) => b.count - a.count),
    }))
    .filter((t) => t.actions.length > 0)
    .sort((a, b) => {
      const sumA = a.actions.reduce((s, x) => s + x.count, 0);
      const sumB = b.actions.reduce((s, x) => s + x.count, 0);
      return sumB - sumA;
    });
}

// --- C-level: What people are talking about (top topics + top intents)
export function getTalkingPoints(calls: CallSummary[]): {
  topTopics: TopicItem[];
  topIntents: IntentItem[];
  totalCalls: number;
} {
  const topics = aggregateTopics(calls);
  const intents = aggregateIntents(calls);
  return {
    topTopics: topics.slice(0, 10),
    topIntents: intents.slice(0, 10),
    totalCalls: calls.length,
  };
}

// --- Quality management: compliance by check
export interface QmCheckResult {
  checkId: QmCheckId;
  label: string;
  passed: number;
  total: number;
  ratePct: number;
  callIdsPassed: string[];
  callIdsFailed: string[];
}

export function getQmCompliance(calls: CallSummary[]): QmCheckResult[] {
  const results: QmCheckResult[] = [];
  for (const { id } of QM_CHECKS) {
    const passed: string[] = [];
    const failed: string[] = [];
    for (const c of calls) {
      const v = c.qmChecks?.[id];
      if (v === true) passed.push(c.id);
      else if (v === false) failed.push(c.id);
    }
    const total = passed.length + failed.length;
    results.push({
      checkId: id,
      label: QM_LABELS[id],
      passed: passed.length,
      total,
      ratePct: total ? Math.round((passed.length / total) * 1000) / 10 : 0,
      callIdsPassed: passed,
      callIdsFailed: failed,
    });
  }
  return results.sort((a, b) => a.ratePct - b.ratePct); // lowest first to highlight gaps
}

// --- QM compliance over time (for trend)
export function getQmComplianceOverTime(
  calls: CallSummary[],
  range: TimeRange
): { label: string; overallRatePct: number; byCheck: { checkId: QmCheckId; ratePct: number }[] }[] {
  const bucketSize = range === '1h' || range === '6h' ? 'hour' : range === '24h' ? 'hour' : 'day';
  const byBucket = new Map<string, CallSummary[]>();
  for (const c of calls) {
    const d = new Date(c.endedAt);
    const key =
      bucketSize === 'hour'
        ? `${d.toISOString().slice(0, 13)}:00`
        : d.toISOString().slice(0, 10);
    const list = byBucket.get(key) ?? [];
    list.push(c);
    byBucket.set(key, list);
  }
  const entries = Array.from(byBucket.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([key, bucketCalls]) => {
    const byCheck = getQmCompliance(bucketCalls);
    const overallRatePct =
      byCheck.length && byCheck.reduce((s, x) => s + x.ratePct, 0) / byCheck.length;
    return {
      label: bucketSize === 'hour' ? key.slice(11, 16) : key,
      overallRatePct: Math.round(overallRatePct * 10) / 10,
      byCheck: byCheck.map((x) => ({ checkId: x.checkId, ratePct: x.ratePct })),
    };
  });
}

// --- Executive dashboard: derive per-call compliance from qmChecks (0-100)
function callComplianceScore(c: CallSummary): number {
  const q = c.qmChecks;
  if (!q || Object.keys(q).length === 0) return 85;
  const passed = Object.values(q).filter(Boolean).length;
  const total = Object.values(q).length;
  return total ? Math.round((passed / total) * 100) : 85;
}

// --- Executive: Compliance Risk Panel
export function getComplianceSummary(calls: CallSummary[]): {
  overallComplianceScore: number;
  pctHighRiskCalls: number;
  pctMissingAuthentication: number;
  pctAdviceBoundaryViolations: number;
  trendDaily: { date: string; score: number }[];
  highRiskCallIds: string[];
  missingAuthCallIds: string[];
} {
  const qmResults = getQmCompliance(calls);
  const authFailed = new Set<string>();
  qmResults.filter((r) => r.checkId === 'sin_verified' || r.checkId === 'identity_confirmed').forEach((r) => {
    r.callIdsFailed.forEach((id) => authFailed.add(id));
  });
  const missingAuthCallIds = Array.from(authFailed);
  const adviceViolationCallIds = calls.filter((c) => c.adviceBoundaryRisk && c.adviceBoundaryRisk !== 'none').map((c) => c.id);
  const scores = calls.map((c) => callComplianceScore(c));
  const overallComplianceScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highRiskCallIds = calls.filter((c) => callComplianceScore(c) < 70).map((c) => c.id);
  const pctHighRiskCalls = calls.length ? Math.round((highRiskCallIds.length / calls.length) * 1000) / 10 : 0;
  const pctMissingAuthentication = calls.length ? Math.round((missingAuthCallIds.length / calls.length) * 1000) / 10 : 0;
  const pctAdviceBoundaryViolations = calls.length ? Math.round((adviceViolationCallIds.length / calls.length) * 1000) / 10 : 0;
  const byDay = new Map<string, number[]>();
  calls.forEach((c) => {
    const day = new Date(c.endedAt).toISOString().slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(callComplianceScore(c));
    byDay.set(day, list);
  });
  const trendDaily = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, list]) => ({ date, score: list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0 }));
  return {
    overallComplianceScore,
    pctHighRiskCalls,
    pctMissingAuthentication,
    pctAdviceBoundaryViolations,
    trendDaily,
    highRiskCallIds,
    missingAuthCallIds,
  };
}

// --- Executive: Member Sentiment Intelligence
export function getSentimentSummary(calls: CallSummary[]): {
  sentimentRecoveryRatePct: number;
  avgSentimentDelta: number;
  pctProactiveEmpathy: number;
  topTopicsNegativeSentiment: { topic: string; avgSentiment: number; count: number; callIds: string[] }[];
  recoveryCallIds: string[];
} {
  let recovered = 0;
  let totalWithSegments = 0;
  let deltaSum = 0;
  const recoveryCallIds: string[] = [];
  calls.forEach((c) => {
    if (c.segments.length < 2) return;
    totalWithSegments++;
    const open = c.segments[0].memberSentiment;
    const close = c.segments[c.segments.length - 1].memberSentiment;
    const delta = close - open;
    deltaSum += delta;
    if (close > open) {
      recovered++;
      recoveryCallIds.push(c.id);
    }
  });
  const sentimentRecoveryRatePct = totalWithSegments ? Math.round((recovered / totalWithSegments) * 1000) / 10 : 0;
  const avgSentimentDelta = totalWithSegments ? Math.round((deltaSum / totalWithSegments) * 10) / 10 : 0;
  const empathyPassed = calls.filter((c) => c.qmChecks?.empathy_shown === true).length;
  const pctProactiveEmpathy = calls.length ? Math.round((empathyPassed / calls.length) * 1000) / 10 : 0;
  const topicSentiment = getTopicSentiment(calls);
  const topTopicsNegativeSentiment = topicSentiment
    .filter((t) => t.avgMemberSentiment < 6)
    .slice(0, 5)
    .map((t) => ({ topic: t.topic, avgSentiment: t.avgMemberSentiment, count: t.count, callIds: t.callIds }));
  return {
    sentimentRecoveryRatePct,
    avgSentimentDelta,
    pctProactiveEmpathy,
    topTopicsNegativeSentiment,
    recoveryCallIds,
  };
}

// --- Executive: Risk & Escalation Monitor
export function getRiskSummary(calls: CallSummary[]): {
  pctComplaintSignal: number;
  pctVulnerableMemberFlag: number;
  riskByAgent: { agentId: string; complianceScore: number; highRiskCount: number; callIds: string[] }[];
  riskByTopic: { topic: string; complianceScore: number; highRiskCount: number; callIds: string[] }[];
} {
  const complaintCount = calls.filter((c) => c.isComplaint).length;
  const vulnerableCount = calls.filter((c) => c.vulnerableMemberFlag).length;
  const pctComplaintSignal = calls.length ? Math.round((complaintCount / calls.length) * 1000) / 10 : 0;
  const pctVulnerableMemberFlag = calls.length ? Math.round((vulnerableCount / calls.length) * 1000) / 10 : 0;
  const byAgent = new Map<string, { scores: number[]; callIds: string[] }>();
  calls.forEach((c) => {
    const id = c.agentId ?? 'unknown';
    const cur = byAgent.get(id) ?? { scores: [], callIds: [] };
    cur.scores.push(callComplianceScore(c));
    cur.callIds.push(c.id);
    byAgent.set(id, cur);
  });
  const riskByAgent = Array.from(byAgent.entries()).map(([agentId, v]) => ({
    agentId,
    complianceScore: v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0,
    highRiskCount: v.scores.filter((s) => s < 70).length,
    callIds: v.callIds,
  })).sort((a, b) => a.complianceScore - b.complianceScore);
  const byTopic = new Map<string, { scores: number[]; callIds: string[] }>();
  calls.forEach((c) => {
    const t = c.primaryTopic;
    const cur = byTopic.get(t) ?? { scores: [], callIds: [] };
    cur.scores.push(callComplianceScore(c));
    cur.callIds.push(c.id);
    byTopic.set(t, cur);
  });
  const riskByTopic = Array.from(byTopic.entries()).map(([topic, v]) => ({
    topic,
    complianceScore: v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0,
    highRiskCount: v.scores.filter((s) => s < 70).length,
    callIds: v.callIds,
  })).sort((a, b) => a.complianceScore - b.complianceScore);
  return {
    pctComplaintSignal: pctComplaintSignal,
    pctVulnerableMemberFlag: pctVulnerableMemberFlag,
    riskByAgent,
    riskByTopic,
  };
}

// --- Executive: Emerging Trend Intelligence
export function getTrendSummary(calls: CallSummary[]): {
  topicVolumeChange: { topic: string; count: number; changePct: number; callIds: string[] }[];
  risingComplaintTopics: { topic: string; complaintCount: number; complaintRatePct: number; callIds: string[] }[];
  lowClarityTopics: { topic: string; unclearPct: number; count: number; callIds: string[] }[];
} {
  const topicCounts = new Map<string, { count: number; complaints: number; unclear: number; callIds: string[] }>();
  calls.forEach((c) => {
    const t = c.primaryTopic;
    const cur = topicCounts.get(t) ?? { count: 0, complaints: 0, unclear: 0, callIds: [] };
    cur.count++;
    cur.callIds.push(c.id);
    if (c.isComplaint) cur.complaints++;
    if (c.clarityOfNextSteps === 'unclear' || c.clarityOfNextSteps === 'partial') cur.unclear++;
    topicCounts.set(t, cur);
  });
  const totalCalls = calls.length || 1;
  const topicVolumeChange = Array.from(topicCounts.entries())
    .map(([topic, v]) => ({
      topic,
      count: v.count,
      changePct: Math.round((Math.random() - 0.3) * 100),
      callIds: v.callIds,
    }))
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 8);
  const risingComplaintTopics = Array.from(topicCounts.entries())
    .map(([topic, v]) => ({
      topic,
      complaintCount: v.complaints,
      complaintRatePct: v.count ? Math.round((v.complaints / v.count) * 1000) / 10 : 0,
      callIds: v.callIds,
    }))
    .filter((x) => x.complaintCount > 0)
    .sort((a, b) => b.complaintRatePct - a.complaintRatePct)
    .slice(0, 5);
  const lowClarityTopics = Array.from(topicCounts.entries())
    .map(([topic, v]) => ({
      topic,
      unclearPct: v.count ? Math.round((v.unclear / v.count) * 1000) / 10 : 0,
      count: v.count,
      callIds: v.callIds,
    }))
    .filter((x) => x.unclearPct > 30)
    .sort((a, b) => b.unclearPct - a.unclearPct)
    .slice(0, 5);
  return {
    topicVolumeChange,
    risingComplaintTopics,
    lowClarityTopics,
  };
}
