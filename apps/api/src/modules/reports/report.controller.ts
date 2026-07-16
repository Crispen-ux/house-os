import { Request, Response, NextFunction } from 'express';
import * as service from './report.service';

export async function taskCompletion(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId, startDate, endDate } = req.query as Record<string, string>;
    if (!householdId || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'householdId, startDate, endDate required' });
    }
    const report = await service.getTaskCompletionReport(householdId, startDate, endDate, req.user!.userId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function memberPerformance(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId, memberId, startDate, endDate } = req.query as Record<string, string>;
    if (!householdId || !memberId || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'householdId, memberId, startDate, endDate required' });
    }
    const report = await service.getMemberPerformance(householdId, memberId, startDate, endDate, req.user!.userId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId } = req.params;
    const stats = await service.getDashboardStats(householdId, req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
