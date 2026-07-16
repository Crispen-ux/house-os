import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { authRouter } from './modules/auth/auth.routes';
import { householdRouter } from './modules/households/household.routes';
import { choreRouter } from './modules/chores/chore.routes';
import { rotationRouter } from './modules/rotations/rotation.routes';
import { swapRouter } from './modules/swaps/swap.routes';
import { shoppingRouter } from './modules/shopping/shopping.routes';
import { calendarRouter } from './modules/calendar/calendar.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { reportRouter } from './modules/reports/report.routes';
import { leaderboardRouter } from './modules/leaderboard/leaderboard.routes';
import { settingsRouter } from './modules/settings/setting.routes';
import { rewardRouter } from './modules/rewards/reward.routes';
import { invitationPublicRouter, invitationAuthenticatedRouter } from './modules/invitations/invitation.routes';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/households', householdRouter);
  app.use('/api/v1/chores', choreRouter);
  app.use('/api/v1/rotations', rotationRouter);
  app.use('/api/v1/swaps', swapRouter);
  app.use('/api/v1/shopping', shoppingRouter);
  app.use('/api/v1/calendar', calendarRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/reports', reportRouter);
  app.use('/api/v1/leaderboard', leaderboardRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/rewards', rewardRouter);
  app.use('/api/v1/invitations', invitationPublicRouter);
  app.use('/api/v1/invitations', invitationAuthenticatedRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
