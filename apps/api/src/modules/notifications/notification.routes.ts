import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './notification.controller';

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get('/', controller.list);
notificationRouter.get('/unread', controller.getUnread);
notificationRouter.post('/:id/read', controller.markRead);
notificationRouter.post('/read-all', controller.markAllRead);
