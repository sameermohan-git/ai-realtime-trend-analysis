/**
 * Copilot: natural language → chart config.
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise enhanced keyword parsing.
 */

export type ChartType = 'bar' | 'line' | 'pie' | 'area';
export type ChartMetric = 'intents' | 'topics' | 'sentiment' | 'calls' | 'volume-over-time';

export interface CopilotChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataKey: string;
  metric: ChartMetric;
}

const VALID_TYPES: ChartType[] = ['bar', 'line', 'pie', 'area'];
const VALID_METRICS: ChartMetric[] = ['intents', 'topics', 'sentiment', 'calls', 'volume-over-time'];

function parseFromKeywords(text: string): { type: ChartType; metric: ChartMetric; title: string } {
  const t = text.toLowerCase();
  let type: ChartType = 'bar';
  let metric: ChartMetric = 'intents';
  let title = 'Custom view';

  // Chart type
  if (t.includes('line') || t.includes('trend') && t.includes('time')) type = 'line';
  else if (t.includes('pie') || t.includes('breakdown') || t.includes('donut')) type = 'pie';
  else if (t.includes('area')) type = 'area';

  // Metric
  if (t.includes('topic')) metric = 'topics';
  else if (t.includes('sentiment')) metric = 'sentiment';
  else if (t.includes('volume') && (t.includes('time') || t.includes('over'))) metric = 'volume-over-time';
  else if (t.includes('call volume') || t.includes('number of calls') || (t.includes('calls') && !t.includes('intent')))
    metric = 'calls';

  // Title
  if (t.includes('intent')) title = 'Intents';
  else if (t.includes('topic')) title = 'Topics';
  else if (t.includes('sentiment')) title = 'Member sentiment';
  else if (metric === 'volume-over-time') title = 'Call volume over time';
  else if (metric === 'calls') title = 'Call volume';

  return { type, metric, title };
}

function sanitizeConfig(parsed: { type?: string; metric?: string; title?: string }): { type: ChartType; metric: ChartMetric; title: string } {
  const type = parsed.type && VALID_TYPES.includes(parsed.type as ChartType) ? (parsed.type as ChartType) : 'bar';
  const metric = parsed.metric && VALID_METRICS.includes(parsed.metric as ChartMetric) ? (parsed.metric as ChartMetric) : 'intents';
  const title = String(parsed.title || 'Custom view').slice(0, 80);
  return { type, metric, title };
}

/**
 * Call OpenAI to interpret the user query and return a chart config.
 * Returns null on missing key, network error, or invalid response.
 */
async function interpretWithOpenAI(query: string): Promise<{ type: ChartType; metric: ChartMetric; title: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return null;

  const systemPrompt = `You are a dashboard chart assistant. The user asks for a chart in natural language.
Respond with ONLY a single JSON object, no markdown or explanation. Keys: "type", "metric", "title".

- type: one of "bar", "line", "pie", "area"
- metric: one of "intents", "topics", "sentiment", "calls", "volume-over-time"
  - intents = top call intents/reasons
  - topics = main topics discussed
  - sentiment = member sentiment breakdown (negative/neutral/positive)
  - calls = call counts (e.g. by day)
  - volume-over-time = call volume over time buckets (use for "over time" / "trend")
- title: short chart title (e.g. "Topics", "Call volume over time")

Examples:
"pie chart of topics" → {"type":"pie","metric":"topics","title":"Topics"}
"line chart of call volume over time" → {"type":"line","metric":"volume-over-time","title":"Call volume over time"}
"bar chart of intents" → {"type":"bar","metric":"intents","title":"Intents"}
"show sentiment breakdown" → {"type":"pie","metric":"sentiment","title":"Member sentiment"}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[copilot] OpenAI error:', res.status, err?.slice(0, 200));
      return null;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Strip markdown code block if present
    const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(raw) as { type?: string; metric?: string; title?: string };
    return sanitizeConfig(parsed);
  } catch (e) {
    console.warn('[copilot] OpenAI request failed:', (e as Error).message);
    return null;
  }
}

/**
 * Resolve natural language query to a chart config.
 * Uses OpenAI when configured, otherwise keyword parsing.
 */
export async function resolveVisualizationRequest(query: string): Promise<{ config: CopilotChartConfig; message: string }> {
  const id = `chart-${Date.now()}`;
  let resolved = await interpretWithOpenAI(query);
  if (!resolved) {
    resolved = parseFromKeywords(query);
  }

  const { type, metric, title } = resolved;
  const config: CopilotChartConfig = {
    id,
    type,
    title,
    dataKey: 'count',
    metric,
  };

  return {
    config,
    message: `Added "${title}" as ${type} chart.`,
  };
}
