import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './chore.controller';

export const choreRouter = Router();

choreRouter.use(authenticate);

choreRouter.post('/', controller.create);
choreRouter.get('/household/:householdId', controller.list);
choreRouter.patch('/:choreId', controller.update);
choreRouter.delete('/:choreId', controller.remove);

choreRouter.post('/assign', controller.assign);
choreRouter.get('/assignments/:householdId', controller.getAssignments);
choreRouter.get('/my-tasks', controller.getMyTasks);
choreRouter.post('/:assignmentId/complete', controller.complete);
choreRouter.post('/:assignmentId/skip', controller.skip);
