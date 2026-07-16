import { Request, Response, NextFunction } from 'express';
import * as choreService from './chore.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const chore = await choreService.createChore(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: chore });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const chores = await choreService.getHouseholdChores(req.params.householdId, req.user!.userId);
    res.json({ success: true, data: chores });
  } catch (error) {
    next(error);
  }
}

export async function assign(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await choreService.assignChore(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function getAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId } = req.params;
    const { date, status } = req.query as { date?: string; status?: string };
    const assignments = await choreService.getAssignments(householdId, req.user!.userId, date, status);
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
}

export async function getMyTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as { status?: string };
    const tasks = await choreService.getMyAssignments(req.user!.userId, status);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await choreService.completeTask(req.params.assignmentId, req.user!.userId);
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function skip(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body;
    const assignment = await choreService.skipTask(req.params.assignmentId, req.user!.userId, reason);
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const chore = await choreService.updateChore(req.params.choreId, req.body, req.user!.userId);
    res.json({ success: true, data: chore });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await choreService.deleteChore(req.params.choreId, req.user!.userId);
    res.json({ success: true, message: 'Chore deleted' });
  } catch (error) {
    next(error);
  }
}
