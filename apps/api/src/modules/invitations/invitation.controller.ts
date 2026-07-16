import { Request, Response, NextFunction } from 'express';
import * as invitationService from './invitation.service';
import { RoleType } from '@house-os/database';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, role, message } = req.body;
    const householdId = req.params.householdId;
    const invitation = await invitationService.createInvitation(
      householdId,
      req.user!.userId,
      email,
      (role as RoleType) || RoleType.ADULT,
      message,
    );
    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function listByHousehold(req: Request, res: Response, next: NextFunction) {
  try {
    const householdId = req.params.householdId;
    const invitations = await invitationService.getHouseholdInvitations(householdId, req.user!.userId);
    res.json({ success: true, data: invitations });
  } catch (error) {
    next(error);
  }
}

export async function getByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await invitationService.getInvitationByToken(req.params.token);
    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await invitationService.acceptInvitation(req.params.token, req.user!.userId);
    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function decline(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await invitationService.declineInvitation(req.params.token);
    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await invitationService.cancelInvitation(
      req.params.invitationId,
      req.params.householdId,
      req.user!.userId,
    );
    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function resend(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await invitationService.resendInvitation(
      req.params.invitationId,
      req.params.householdId,
      req.user!.userId,
    );
    res.json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}
