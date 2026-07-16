import { Request, Response, NextFunction } from 'express';
import * as service from './notification.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await service.getNotifications(req.user!.userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function getUnread(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await service.getNotifications(req.user!.userId, true);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await service.markAsRead(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await service.markAllAsRead(req.user!.userId);
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
}
