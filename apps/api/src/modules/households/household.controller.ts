import { Request, Response, NextFunction } from 'express';
import * as householdService from './household.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description } = req.body;
    const household = await householdService.createHousehold(name, description, req.user!.userId);
    res.status(201).json({ success: true, data: household });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const household = await householdService.getHousehold(req.params.householdId, req.user!.userId);
    res.json({ success: true, data: household });
  } catch (error) {
    next(error);
  }
}

export async function getMyHouseholds(req: Request, res: Response, next: NextFunction) {
  try {
    const households = await householdService.getUserHouseholds(req.user!.userId);
    res.json({ success: true, data: households });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const member = await householdService.updateMemberRole(
      req.params.householdId,
      req.user!.userId,
      req.params.userId,
      role,
    );
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await householdService.removeMember(req.params.householdId, req.user!.userId, req.params.userId);
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
}
