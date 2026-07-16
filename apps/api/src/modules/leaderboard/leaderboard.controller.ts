import { Request, Response, NextFunction } from 'express';
import * as service from './leaderboard.service';

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const leaderboard = await service.getLeaderboard(
      req.params.householdId,
      req.params.type as any,
      req.user!.userId,
    );
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
}
