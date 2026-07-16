import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './leaderboard.controller';

export const leaderboardRouter = Router();
leaderboardRouter.use(authenticate);

leaderboardRouter.get('/:householdId/:type', controller.get);
