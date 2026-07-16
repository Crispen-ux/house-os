import { Request, Response, NextFunction } from 'express';
import * as service from './calendar.service';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId } = req.params;
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate required' });
    }
    const events = await service.getCalendarEvents(householdId, startDate, endDate, req.user!.userId);
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
}
