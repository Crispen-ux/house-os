import { Request, Response, NextFunction } from 'express';
import * as service from './rotation.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId, name, description, startDate, cycleDays } = req.body;
    const rotation = await service.createRotation(householdId, name, description, startDate, cycleDays, req.user!.userId);
    res.status(201).json({ success: true, data: rotation });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const rotations = await service.getRotations(req.params.householdId, req.user!.userId);
    res.json({ success: true, data: rotations });
  } catch (error) {
    next(error);
  }
}

export async function addRule(req: Request, res: Response, next: NextFunction) {
  try {
    const { choreId, memberId, position } = req.body;
    const rule = await service.addRotationRule(req.params.rotationId, choreId, memberId, position, req.user!.userId);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function rotate(req: Request, res: Response, next: NextFunction) {
  try {
    const assignments = await service.rotateNow(req.params.rotationId, req.user!.userId);
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
}
