import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './setting.controller';

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/user', controller.getUserSettings);
settingsRouter.patch('/user', controller.updateUserSettings);
settingsRouter.get('/household/:householdId', controller.getHouseholdSettings);
settingsRouter.patch('/household/:householdId', controller.updateHouseholdSettings);
