import { Router } from 'express';
import type { TimeRange } from './types.js';
import {
  getCalls,
  aggregateIntents,
  aggregateTopics,
  aggregateSentiment,
  getVolumeOverTime,
  getTopicSentiment,
  getIntentComplaints,
  getVolumeByHour,
  getVolumeByDayOfWeek,
  getKpis,
  getMemberAgentSentiment,
  generateCalls,
  getNeedCategories,
  getSentimentArc,
  getOutcomeHeatmap,
  getEmotionProfile,
  getHandleTimeSentiment,
} from './mockData.js';

const COMPLAINT_THRESHOLD = 8;
const ALERT_WINDOW_MINUTES = 60;

function parseRange(range?: TimeRange): { from: Date; to: Date } {
  const to = new Date();
  let from = new Date();
  switch (range) {
    case '1h':
      from.setHours(from.getHours() - 1);
      break;
    case '6h':
      from.setHours(from.getHours() - 6);
      break;
    case '24h':
      from.setDate(from.getDate() - 1);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    default:
      from.setHours(from.getHours() - 24);
  }
  return { from, to };
}

export function createRouter(): Router {
  const router = Router();

  router.get('/trends/intents', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const intents = aggregateIntents(calls);
    res.json({ intents, totalCalls: calls.length });
  });

  router.get('/trends/topics', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const topics = aggregateTopics(calls);
    res.json({ topics, totalCalls: calls.length });
  });

  router.get('/trends/sentiment', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const sentiment = aggregateSentiment(calls);
    res.json({ sentiment, totalCalls: calls.length });
  });

  router.get('/calls', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
    const intent = req.query.intent as string | undefined;
    const topic = req.query.topic as string | undefined;
    const complaintOnly = req.query.complaints === 'true';
    const { from, to } = parseRange(range);
    let calls = getCalls(from, to);
    if (intent) calls = calls.filter((c) => c.primaryIntent === intent);
    if (topic) calls = calls.filter((c) => c.primaryTopic === topic);
    if (complaintOnly) calls = calls.filter((c) => c.isComplaint);
    calls = calls.slice(0, limit);
    res.json({ calls });
  });

  router.get('/calls/:id', (req, res) => {
    const { from, to } = parseRange('30d');
    const calls = getCalls(from, to);
    const call = calls.find((c) => c.id === req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });
    res.json(call);
  });

  router.get('/insights/volume-over-time', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const buckets = getVolumeOverTime(calls, range);
    res.json({ buckets });
  });

  router.get('/insights/topic-sentiment', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const topics = getTopicSentiment(calls);
    res.json({ topics });
  });

  router.get('/insights/intent-complaints', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const intents = getIntentComplaints(calls);
    res.json({ intents });
  });

  router.get('/insights/volume-by-hour', (req, res) => {
    const range = (req.query.range as TimeRange) || '7d';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const buckets = getVolumeByHour(calls);
    res.json({ buckets });
  });

  router.get('/insights/volume-by-day', (req, res) => {
    const range = (req.query.range as TimeRange) || '30d';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const buckets = getVolumeByDayOfWeek(calls);
    res.json({ buckets });
  });

  router.get('/insights/kpis', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const kpis = getKpis(calls);
    res.json(kpis);
  });

  router.get('/insights/member-agent-sentiment', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const data = getMemberAgentSentiment(calls);
    res.json({ data });
  });

  router.get('/alerts/complaints', (req, res) => {
    const to = new Date();
    const from = new Date(to.getTime() - ALERT_WINDOW_MINUTES * 60 * 1000);
    const calls = getCalls(from, to);
    const complaintCount = calls.filter((c) => c.isComplaint).length;
    const complaintsElevated = complaintCount >= COMPLAINT_THRESHOLD;
    res.json({
      complaintsElevated,
      complaintCount,
      threshold: COMPLAINT_THRESHOLD,
      windowMinutes: ALERT_WINDOW_MINUTES,
      message: complaintsElevated
        ? `High complaint volume: ${complaintCount} complaints in the last ${ALERT_WINDOW_MINUTES} minutes (threshold: ${COMPLAINT_THRESHOLD}).`
        : undefined,
    });
  });

  // C-suite: Member Journey & Impact endpoints
  router.get('/insights/need-categories', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const categories = getNeedCategories(calls);
    res.json({ categories });
  });

  router.get('/insights/sentiment-arc', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const arcs = getSentimentArc(calls);
    res.json({ arcs });
  });

  router.get('/insights/outcome-heatmap', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const data = getOutcomeHeatmap(calls);
    res.json(data);
  });

  router.get('/insights/emotion-profile', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const emotions = getEmotionProfile(calls);
    res.json({ emotions });
  });

  router.get('/insights/handle-time-sentiment', (req, res) => {
    const range = (req.query.range as TimeRange) || '24h';
    const { from, to } = parseRange(range);
    const calls = getCalls(from, to);
    const data = getHandleTimeSentiment(calls);
    res.json(data);
  });

  // Copilot: add/update visualization from natural language (demo: keyword-based)
  router.post('/copilot/visualization', (req, res) => {
    const text = String((req.body?.query || req.body?.text || '')).toLowerCase();
    const id = `chart-${Date.now()}`;
    let type: 'bar' | 'line' | 'pie' | 'area' = 'bar';
    let metric: 'intents' | 'topics' | 'sentiment' | 'calls' = 'intents';
    let title = 'Custom view';

    if (text.includes('line') || text.includes('trend over time')) type = 'line';
    else if (text.includes('pie') || text.includes('breakdown')) type = 'pie';
    else if (text.includes('area')) type = 'area';

    if (text.includes('topic')) metric = 'topics';
    else if (text.includes('sentiment')) metric = 'sentiment';
    else if (text.includes('call volume') || text.includes('calls')) metric = 'calls';

    if (text.includes('intent')) title = 'Intents';
    else if (text.includes('topic')) title = 'Topics';
    else if (text.includes('sentiment')) title = 'Member sentiment';
    else if (text.includes('complaint')) title = 'Complaints';

    res.json({
      config: { id, type, title, dataKey: 'count', metric },
      message: `Added ${title} as ${type} chart.`,
    });
  });

  return router;
}
