import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './ai.controller';

export const aiRouter = Router();
aiRouter.use(authenticate);

aiRouter.post('/query', controller.query);
aiRouter.get('/history', controller.getHistory);
