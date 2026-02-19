import { v4 as uuid } from 'uuid';
import type {
  IntentItem,
  TopicItem,
  SentimentBucket,
  CallSummary,
  CallSegment,
  TimeRange,
  NeedCategoryItem,
  SentimentArcItem,
  HeatmapCell,
  EmotionProfileItem,
  HandleTimeSentimentItem,
} from './types.js';

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

const EMOTIONS = ['angry', 'disappointed', 'concerned', 'neutral', 'satisfied', 'relieved'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addHours(d: Date, h: number): Date {
  const out = new Date(d);
  out.setHours(out.getHours() + h);
  return out;
}

export function generateCalls(count: number, options?: { complaintBias?: number }): CallSummary[] {
  const complaintBias = options?.complaintBias ?? 0.15;
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
    const memberSent = isComplaint ? randomInt(20, 45) : randomInt(40, 95);
    const agentSent = randomInt(50, 95);

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
        memberSentiment: memberSent + randomInt(-10, 10),
        agentSentiment: agentSent + randomInt(-5, 5),
        emotions: Object.fromEntries(
          EMOTIONS.map((e) => [e, Math.random()])
        ) as Record<string, number>,
      });
      offset += segLen;
    }

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
      isComplaint,
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
    // Seed last hour with extra complaints so alert banner can trigger in demo
    const lastHour = generateCalls(15, { complaintBias: 0.8 });
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
    { label: 'Negative (0-30)', min: 0, max: 30, count: 0, callIds: [] as string[] },
    { label: 'Neutral (31-60)', min: 31, max: 60, count: 0, callIds: [] as string[] },
    { label: 'Positive (61-100)', min: 61, max: 100, count: 0, callIds: [] as string[] },
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
  const bucket = (n: number) => Math.min(95, Math.floor(n / 10) * 10);
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
