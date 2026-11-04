import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requestLog } from './middleware/requestLog.js';
import { notFound, errorHandler } from './middleware/error.js';
import { healthRouter } from './routes/health.js';

export const app = express();

app.use(cors({ origin: config.corsOrigin })); // PR-35
app.use(express.json());
app.use(requestLog);
app.use(healthRouter);
// /api 라우터는 BE-05부터 여기에 연결한다
app.use(notFound);
app.use(errorHandler);
