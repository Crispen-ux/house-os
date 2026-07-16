import { Request, Response, NextFunction } from 'express';
import * as service from './reward.service';

export async function getPoints(req: Request, res: Response, next: NextFunction) {
  try {
    const points = await service.getUserPoints(req.user!.userId, req.params.householdId);
    res.json({ success: true, data: points });
  } catch (error) {
    next(error);
  }
}

export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const achievements = await service.getUserAchievements(req.user!.userId);
    res.json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
}

export async function getBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const badges = await service.getUserBadges(req.user!.userId);
    res.json({ success: true, data: badges });
  } catch (error) {
    next(error);
  }
}

export async function getAvailableAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const achievements = await service.getAvailableAchievements();
    res.json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
}

export async function getAvailableBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const badges = await service.getAvailableBadges();
    res.json({ success: true, data: badges });
  } catch (error) {
    next(error);
  }
}
