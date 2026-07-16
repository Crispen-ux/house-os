import { prisma, RoleType, InvitationStatus } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from './invitation.email';

const INVITATION_EXPIRY_DAYS = 7;

export async function createInvitation(
  householdId: string,
  invitedById: string,
  email: string,
  role: RoleType = RoleType.ADULT,
  message?: string,
) {
  const inviter = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: invitedById } },
  });

  if (!inviter || (inviter.role !== RoleType.OWNER && inviter.role !== RoleType.ADMIN)) {
    throw new AppError(403, 'Only owners and admins can send invitations');
  }

  const existingMember = await prisma.householdMember.findFirst({
    where: {
      householdId,
      user: { email },
      isActive: true,
    },
  });

  if (existingMember) {
    throw new AppError(409, 'This person is already a member of the household');
  }

  const existingPending = await prisma.householdInvitation.findFirst({
    where: {
      householdId,
      email,
      status: InvitationStatus.PENDING,
    },
  });

  if (existingPending) {
    throw new AppError(409, 'An invitation has already been sent to this email');
  }

  const household = await prisma.household.findUnique({ where: { id: householdId } });
  if (!household) throw new AppError(404, 'Household not found');

  const inviterUser = await prisma.user.findUnique({
    where: { id: invitedById },
    select: { firstName: true, lastName: true, displayName: true },
  });

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const invitation = await prisma.householdInvitation.create({
    data: {
      householdId,
      invitedById,
      email,
      role,
      token,
      message,
      expiresAt,
    },
    include: {
      household: { select: { name: true } },
      invitedBy: { select: { firstName: true, lastName: true, displayName: true } },
    },
  });

  await createAuditLog({
    householdId,
    userId: invitedById,
    action: 'INVITATION_SENT',
    entityType: 'household_invitation',
    entityId: invitation.id,
    newValue: { email, role, householdName: household.name },
  });

  sendInvitationEmail({
    to: email,
    householdName: household.name,
    inviterName: inviterUser?.displayName || `${inviterUser?.firstName} ${inviterUser?.lastName}`,
    token,
    role,
    message,
    expiresAt,
  }).catch(console.error);

  return invitation;
}

export async function getHouseholdInvitations(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });

  if (!member) throw new AppError(403, 'Not a member of this household');

  return prisma.householdInvitation.findMany({
    where: { householdId },
    include: {
      invitedBy: {
        select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.householdInvitation.findUnique({
    where: { token },
    include: {
      household: { select: { id: true, name: true, description: true } },
      invitedBy: { select: { firstName: true, lastName: true, displayName: true } },
    },
  });

  if (!invitation) throw new AppError(404, 'Invitation not found');

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(400, 'This invitation is no longer valid');
  }

  if (new Date() > invitation.expiresAt) {
    throw new AppError(410, 'This invitation has expired');
  }

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.householdInvitation.findUnique({
    where: { token },
    include: { household: { select: { name: true } } },
  });

  if (!invitation) throw new AppError(404, 'Invitation not found');

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(400, 'This invitation has already been processed');
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.householdInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new AppError(410, 'This invitation has expired');
  }

  const existingMember = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: invitation.householdId, userId } },
  });

  if (existingMember) {
    if (existingMember.isActive) {
      await prisma.householdInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });
      throw new AppError(409, 'You are already a member of this household');
    }
    await prisma.householdMember.update({
      where: { id: existingMember.id },
      data: { isActive: true, role: invitation.role },
    });
  } else {
    await prisma.householdMember.create({
      data: {
        householdId: invitation.householdId,
        userId,
        role: invitation.role,
      },
    });
  }

  const updated = await prisma.householdInvitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
  });

  await createAuditLog({
    householdId: invitation.householdId,
    userId,
    action: 'INVITATION_ACCEPTED',
    entityType: 'household_invitation',
    entityId: invitation.id,
    newValue: { email: invitation.email, role: invitation.role, householdName: invitation.household.name },
  });

  return updated;
}

export async function declineInvitation(token: string) {
  const invitation = await prisma.householdInvitation.findUnique({ where: { token } });
  if (!invitation) throw new AppError(404, 'Invitation not found');

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(400, 'This invitation has already been processed');
  }

  const updated = await prisma.householdInvitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.DECLINED, declinedAt: new Date() },
  });

  await createAuditLog({
    householdId: invitation.householdId,
    userId: invitation.invitedById,
    action: 'INVITATION_DECLINED',
    entityType: 'household_invitation',
    entityId: invitation.id,
    newValue: { email: invitation.email },
  });

  return updated;
}

export async function cancelInvitation(invitationId: string, householdId: string, userId: string) {
  const inviter = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });

  if (!inviter || (inviter.role !== RoleType.OWNER && inviter.role !== RoleType.ADMIN)) {
    throw new AppError(403, 'Only owners and admins can cancel invitations');
  }

  const invitation = await prisma.householdInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new AppError(404, 'Invitation not found');

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(400, 'This invitation has already been processed');
  }

  const updated = await prisma.householdInvitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.CANCELLED },
  });

  await createAuditLog({
    householdId,
    userId,
    action: 'INVITATION_CANCELLED',
    entityType: 'household_invitation',
    entityId: invitationId,
    newValue: { email: invitation.email },
  });

  return updated;
}

export async function resendInvitation(invitationId: string, householdId: string, userId: string) {
  const inviter = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });

  if (!inviter || (inviter.role !== RoleType.OWNER && inviter.role !== RoleType.ADMIN)) {
    throw new AppError(403, 'Only owners and admins can resend invitations');
  }

  const invitation = await prisma.householdInvitation.findUnique({
    where: { id: invitationId },
    include: {
      household: { select: { name: true } },
      invitedBy: { select: { firstName: true, lastName: true, displayName: true } },
    },
  });

  if (!invitation) throw new AppError(404, 'Invitation not found');

  if (invitation.status === InvitationStatus.ACCEPTED || invitation.status === InvitationStatus.DECLINED) {
    throw new AppError(400, 'This invitation has already been processed');
  }

  const newToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const updated = await prisma.householdInvitation.update({
    where: { id: invitationId },
    data: {
      token: newToken,
      expiresAt,
      status: InvitationStatus.PENDING,
      lastRemindedAt: new Date(),
    },
  });

  sendInvitationEmail({
    to: invitation.email,
    householdName: invitation.household.name,
    inviterName: invitation.invitedBy?.displayName || `${invitation.invitedBy?.firstName} ${invitation.invitedBy?.lastName}`,
    token: newToken,
    role: invitation.role,
    message: invitation.message || undefined,
    expiresAt,
  }).catch(console.error);

  return updated;
}
