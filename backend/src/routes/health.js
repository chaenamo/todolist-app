import { Router } from 'express';
import { checkConnection } from '../db.js';

export const healthRouter = Router();

// PR-45
healthRouter.get('/health', async (req, res) => {
  try {
    await checkConnection();
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
