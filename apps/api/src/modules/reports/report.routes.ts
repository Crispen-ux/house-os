import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './report.controller';

export const reportRouter = Router();
reportRouter.use(authenticate);

reportRouter.get('/task-completion', controller.taskCompletion);
reportRouter.get('/member-performance', controller.memberPerformance);
reportRouter.get('/dashboard/:householdId', controller.dashboard);
