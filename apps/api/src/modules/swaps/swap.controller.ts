import { Request, Response, NextFunction } from 'express';
import * as swapService from './swap.service';

export async function request(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId, originalChoreId, requestedToId, alternateChoreId, reason } = req.body;
    const swap = await swapService.requestSwap(
      req.user!.userId,
      householdId,
      originalChoreId,
      requestedToId,
      alternateChoreId,
      reason,
    );
    res.status(201).json({ success: true, data: swap });
  } catch (error) {
    next(error);
  }
}

export async function respond(req: Request, res: Response, next: NextFunction) {
  try {
    const { decision, alternateChoreId } = req.body;
    const swap = await swapService.respondToSwap(req.params.swapId, req.user!.userId, decision, alternateChoreId);
    res.json({ success: true, data: swap });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const swap = await swapService.cancelSwap(req.params.swapId, req.user!.userId);
    res.json({ success: true, data: swap });
  } catch (error) {
    next(error);
  }
}

export async function adminOverride(req: Request, res: Response, next: NextFunction) {
  try {
    const { decision } = req.body;
    const swap = await swapService.adminOverride(req.params.swapId, req.user!.userId, decision);
    res.json({ success: true, data: swap });
  } catch (error) {
    next(error);
  }
}

export async function listByHousehold(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId } = req.params;
    const { status } = req.query as { status?: string };
    const swaps = await swapService.getSwapsForHousehold(householdId, req.user!.userId, status);
    res.json({ success: true, data: swaps });
  } catch (error) {
    next(error);
  }
}

export async function getMySwaps(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as { status?: string };
    const swaps = await swapService.getMySwaps(req.user!.userId, status);
    res.json({ success: true, data: swaps });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { householdId } = req.params;
    const { status, memberId } = req.query as { status?: string; memberId?: string };
    const history = await swapService.getSwapHistory(householdId, req.user!.userId, { status, memberId });
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { message } = req.body;
    const msg = await swapService.sendSwapMessage(req.params.swapId, req.user!.userId, message);
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    next(error);
  }
}
