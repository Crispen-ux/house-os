import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './reward.controller';

export const rewardRouter = Router();
rewardRouter.use(authenticate);

rewardRouter.get('/points/:householdId', controller.getPoints);
rewardRouter.get('/achievements', controller.getAchievements);
rewardRouter.get('/badges', controller.getBadges);
rewardRouter.get('/available/achievements', controller.getAvailableAchievements);
rewardRouter.get('/available/badges', controller.getAvailableBadges);
