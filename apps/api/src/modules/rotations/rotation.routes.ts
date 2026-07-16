import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './rotation.controller';

export const rotationRouter = Router();

rotationRouter.use(authenticate);

rotationRouter.post('/', controller.create);
rotationRouter.get('/household/:householdId', controller.list);
rotationRouter.post('/:rotationId/rules', controller.addRule);
rotationRouter.post('/:rotationId/rotate', controller.rotate);
