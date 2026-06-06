import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import logger from './config/logger';
import { traceIdMiddleware } from './middleware/traceId.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

import authRouter from './modules/auth/auth.routes';
import meetingsRouter from './modules/meetings/meetings.routes';
import analysisRouter from './modules/analysis/analysis.routes';
import actionItemsRouter from './modules/actionItems/actionItems.routes';
import { getEvaluation } from './modules/evaluation/evaluation.controller';
import { startReminderJob } from './jobs/reminderJob';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// must be before other middleware so traceId is available on req
app.use(traceIdMiddleware);

app.use((req, _res, next) => {
  logger.info('incoming request', {
    traceId: req.traceId,
    method: req.method,
    path: req.path,
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Meeting Intelligence Service API',
  })
);

app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/meetings', analysisRouter);
app.use('/api/action-items', actionItemsRouter);
app.get('/api/evaluation', getEvaluation);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'not found',
    },
  });
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info('server started', {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      docs: `http://localhost:${PORT}/api-docs`,
    });

    void startReminderJob();
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down');
    server.close(() => {
      logger.info('server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down');
    server.close(() => {
      logger.info('server closed');
      process.exit(0);
    });
  });
}

export default app;
