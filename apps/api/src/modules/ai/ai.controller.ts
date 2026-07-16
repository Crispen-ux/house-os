import { Request, Response, NextFunction } from 'express';
import { prisma } from '@house-os/database';
import * as aiService from './ai.service';

export async function query(req: Request, res: Response, next: NextFunction) {
  try {
    const { prompt, householdId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }
    if (!householdId) {
      return res.status(400).json({ success: false, error: 'Household ID is required' });
    }

    const result = await aiService.processAiQuery(prompt, {
      householdId,
      userId: req.user!.userId,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const conversations = await prisma?.aiConversation.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: conversations || [] });
  } catch (error) {
    next(error);
  }
}
