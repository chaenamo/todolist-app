import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requestLog } from './middleware/requestLog.js';
import { notFound, errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { todosRouter } from './routes/todos.js';
import { mountApiDocs } from './apiDocs.js';
import { usersRouter } from './routes/users.js';

export const app = express();

app.use(cors({ origin: config.corsOrigins })); // PR-35
app.use(express.json());
app.use(requestLog);
app.use(healthRouter);
if (config.isDev) mountApiDocs(app); // 개발 환경에서만 Swagger UI
app.use('/api/auth', authRouter);
// PR-07: 여기부터 /api는 모두 인증 필요. 보호 라우터는 이 아래에 연결한다
app.use('/api', requireAuth);
app.use('/api/categories', categoriesRouter);
app.use('/api/todos', todosRouter);
app.use('/api/users', usersRouter);
app.use(notFound);
app.use(errorHandler);

// Vercel은 default export된 Express 앱을 함수로 실행한다(로컬은 server.js가 listen)
export default app;
