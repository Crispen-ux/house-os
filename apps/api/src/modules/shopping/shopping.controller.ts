import { Request, Response, NextFunction } from 'express';
import * as service from './shopping.service';

export async function createList(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId, title, description } = req.body;
    const list = await service.createList(householdId, title, description, req.user!.userId);
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function getLists(req: Request, res: Response, next: NextFunction) {
  try {
    const lists = await service.getLists(req.params.householdId, req.user!.userId);
    res.json({ success: true, data: lists });
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.addItem(req.params.listId, req.body, req.user!.userId);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function toggleItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.toggleItem(req.params.itemId, req.user!.userId);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function updatePrice(req: Request, res: Response, next: NextFunction) {
  try {
    const { price } = req.body;
    const item = await service.updateItemPrice(req.params.itemId, price, req.user!.userId);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}
