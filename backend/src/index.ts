import express from 'express';
import cors from 'cors';
import { createRouter } from './routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', createRouter());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'trend-dashboard-api' });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`Trend dashboard API listening on port ${PORT}`);
});
