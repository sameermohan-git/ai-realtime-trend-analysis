# OMERS Pensions — Contact Centre Real-Time Trend Analysis

Dashboard for OMERS Pensions contact centre to view **trending intents**, **topics**, and **sentiment** across calls (Five9 → transcript → pipeline). Supports time filters, complaint alerts, drill-down to call level, and a **Copilot-style chat** to add or update visualizations.

## Features

- **Trending intents** — Bar chart of top intents with drill-down to calls
- **Trending topics** — Bar chart of topics (from RAG + LLM pipeline)
- **Member sentiment** — Pie chart (negative / neutral / positive) with drill-down
- **Time range filter** — 1h, 6h, 24h, 7d, 30d
- **Complaint alert banner** — Top banner when complaint volume exceeds threshold (e.g. last 60 min)
- **Call-level drill-down** — From any widget (click bar/segment or “View calls”) → call detail drawer with segments, sentiment, intent/topic
- **Copilot chat** — Natural language “Add pie chart of topics” / “Show sentiment breakdown” to add or update visualizations

## Tech stack

- **Backend:** Node.js, TypeScript, Express (GCP-ready; runs in Docker for demo)
- **Frontend:** React, TypeScript, Vite, Recharts
- **Demo data:** Mock pipeline output (intents, topics, sentiment, call segments)

## Run locally (no Docker)

```bash
# Install dependencies
npm run install:all

# Terminal 1 — API
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3000  

Frontend proxies `/api` to the backend when using `npm run dev:frontend`.

## Run with Docker (C-suite demo)

```bash
docker-compose up --build
```

- **Dashboard:** http://localhost:5173  
- **API:** http://localhost:3000  

Single place to open for execs: **http://localhost:5173**. The complaint banner is pre-seeded so it may appear on load; use time range “1 hour” to see recent data.

## API (backend)

| Endpoint | Description |
|----------|-------------|
| `GET /api/trends/intents?range=24h` | Top intents and counts |
| `GET /api/trends/topics?range=24h` | Top topics and counts |
| `GET /api/trends/sentiment?range=24h` | Sentiment buckets |
| `GET /api/calls?range=24h&intent=...&topic=...&complaints=true` | Call list (optional filters) |
| `GET /api/calls/:id` | Single call detail (segments, sentiment, summary) |
| `GET /api/alerts/complaints` | Whether complaint volume is elevated |
| `POST /api/copilot/visualization` | Body: `{ "query": "Add bar chart of intents" }` → returns chart config |

## Data model (aligned with your pipeline)

- **Calls** — `externalId` (Five9), `startedAt` / `endedAt`, `durationSeconds`, `memberSentiment` / `agentSentiment`, `primaryIntent`, `primaryTopic`, `isComplaint`, `summary`, `segments`.
- **Segments** — `startOffset` / `endOffset`, `topic`, `intent`, `memberSentiment`, `agentSentiment`, optional `emotions` (for weighted sentiment).
- **Alerts** — Threshold (e.g. 8 complaints in last 60 minutes) triggers the top banner.

## Project structure

```
├── backend/          # Node + Express + TS
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes.ts
│   │   ├── mockData.ts
│   │   └── types.ts
│   └── Dockerfile
├── frontend/         # React + Vite + TS
│   ├── src/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── TimeFilter.tsx
│   │   │   ├── IntentsWidget.tsx
│   │   │   ├── TopicsWidget.tsx
│   │   │   ├── SentimentWidget.tsx
│   │   │   ├── CallDetailDrawer.tsx
│   │   │   ├── CopilotChat.tsx
│   │   │   └── CustomCharts.tsx
│   │   └── ...
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Connecting to real pipeline

Replace or extend `backend/src/mockData.ts` and the route handlers in `backend/src/routes.ts` with:

- Your store for post-call summaries (intent, topic, sentiment, segments)
- Real-time or polling for new calls
- Your complaint threshold and window (e.g. from config or env)

The frontend already expects the same response shapes; only the data source needs to change.
