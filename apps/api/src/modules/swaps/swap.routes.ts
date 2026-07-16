import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './swap.controller';

export const swapRouter = Router();

swapRouter.use(authenticate);

swapRouter.post('/request', controller.request);
swapRouter.post('/:swapId/respond', controller.respond);
swapRouter.post('/:swapId/cancel', controller.cancel);
swapRouter.post('/:swapId/admin-override', controller.adminOverride);
swapRouter.get('/household/:householdId', controller.listByHousehold);
swapRouter.get('/my', controller.getMySwaps);
swapRouter.get('/history/:householdId', controller.getHistory);
swapRouter.post('/:swapId/messages', controller.sendMessage);
