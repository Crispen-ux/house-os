import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './household.controller';

export const householdRouter = Router();

householdRouter.use(authenticate);

householdRouter.post('/', controller.create);
householdRouter.get('/', controller.getMyHouseholds);
householdRouter.get('/:householdId', controller.getOne);
householdRouter.patch('/:householdId/members/:userId/role', controller.updateRole);
householdRouter.delete('/:householdId/members/:userId', controller.remove);
