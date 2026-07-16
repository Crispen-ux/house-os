import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './calendar.controller';

export const calendarRouter = Router();
calendarRouter.use(authenticate);

calendarRouter.get('/:householdId', controller.getEvents);
