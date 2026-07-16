import { Request, Response, NextFunction } from 'express';
import * as service from './setting.service';

export async function getUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await service.getUserSettings(req.user!.userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await service.updateUserSettings(req.user!.userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function getHouseholdSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await service.getHouseholdSettings(req.params.householdId, req.user!.userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateHouseholdSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await service.updateHouseholdSettings(req.params.householdId, req.user!.userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}
