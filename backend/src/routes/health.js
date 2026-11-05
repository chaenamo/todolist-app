import { Router } from 'express';
import { checkConnection } from '../db.js';

export const healthRouter = Router();

// PR-45: DB 연결 상태를 함께 알려 준다
healthRouter.get('/health', async (req, res) => {
  try {
    await checkConnection();
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', db: 'disconnected' });
  }
});
