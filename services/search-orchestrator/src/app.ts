import express from 'express';
import { buildHealthResponse } from '@findnmeet/utils';

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json(buildHealthResponse('search-orchestrator'));
});
