import { prisma, SwapStatus, TaskStatus, RoleType } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';
import { awardPoints } from '../../utils/points';

export async function requestSwap(
  requesterId: string,
  householdId: string,
  originalChoreId: string,
  requestedToId: string,
  alternateChoreId?: string,
  reason?: string,
) {
  if (requesterId === requestedToId) {
    throw new AppError(400, 'Cannot swap with yourself');
  }

  const requesterMember = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: requesterId } },
  });
  if (!requesterMember) throw new AppError(403, 'Not a member');

  const targetMember = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: requestedToId } },
  });
  if (!targetMember) throw new AppError(404, 'Target member not found in household');

  const originalAssignment = await prisma.taskAssignment.findFirst({
    where: {
      choreId: originalChoreId,
      assigneeId: requesterId,
      householdId,
      status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
    },
    include: { chore: true },
  });

  if (!originalAssignment) {
    throw new AppError(400, 'No active assignment found for this chore');
  }

  if (originalAssignment.chore.isRestricted && requesterMember.role === RoleType.CHILD) {
    throw new AppError(403, 'Children cannot swap restricted chores');
  }

  if (alternateChoreId) {
    const alternateAssignment = await prisma.taskAssignment.findFirst({
      where: {
        choreId: alternateChoreId,
        assigneeId: requestedToId,
        householdId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      include: { chore: true },
    });

    if (!alternateAssignment) {
      throw new AppError(400, 'No active assignment found for the alternate chore');
    }

    if (alternateAssignment.chore.isRestricted && requesterMember.role === RoleType.CHILD) {
      throw new AppError(403, 'Cannot request a restricted chore');
    }
  }

  const householdSettings = await prisma.householdSetting.findUnique({
    where: { householdId },
  });

  const status = householdSettings?.requireAdminForSwaps
    ? SwapStatus.PENDING
    : SwapStatus.PENDING;

  const swap = await prisma.choreSwap.create({
    data: {
      householdId,
      requesterId,
      requestedToId,
      originalChoreId,
      alternateChoreId,
      reason,
      status,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      requestedTo: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      originalChore: true,
      alternateChore: true,
    },
  });

  await createAuditLog({
    householdId,
    userId: requesterId,
    action: 'SWAP_REQUESTED',
    entityType: 'chore_swap',
    entityId: swap.id,
    newValue: { originalChoreId, requestedToId, alternateChoreId, reason },
  });

  return swap;
}

export async function respondToSwap(
  swapId: string,
  userId: string,
  decision: 'ACCEPTED' | 'DECLINED',
  alternateChoreId?: string,
) {
  const swap = await prisma.choreSwap.findUnique({
    where: { id: swapId },
    include: {
      originalChore: true,
      alternateChore: true,
      requester: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!swap) throw new AppError(404, 'Swap request not found');
  if (swap.requestedToId !== userId) {
    throw new AppError(403, 'This swap request is not for you');
  }
  if (swap.status !== SwapStatus.PENDING) {
    throw new AppError(400, `Swap request is already ${swap.status.toLowerCase()}`);
  }

  if (decision === 'ACCEPTED') {
    return executeSwapApproval(swap, userId);
  }

  const updated = await prisma.choreSwap.update({
    where: { id: swapId },
    data: { status: SwapStatus.DECLINED, decidedAt: new Date() },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      requestedTo: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      originalChore: true,
      alternateChore: true,
    },
  });

  await createAuditLog({
    householdId: swap.householdId,
    userId,
    action: 'SWAP_DECLINED',
    entityType: 'chore_swap',
    entityId: swapId,
  });

  return updated;
}

async function executeSwapApproval(swap: any, userId: string) {
  const originalAssignment = await prisma.taskAssignment.findFirst({
    where: {
      choreId: swap.originalChoreId,
      assigneeId: swap.requesterId,
      householdId: swap.householdId,
      status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
    },
  });

  if (!originalAssignment) {
    throw new AppError(400, 'Original task no longer available');
  }

  const updatedSwap = await prisma.choreSwap.update({
    where: { id: swap.id },
    data: { status: SwapStatus.ACCEPTED, decidedAt: new Date() },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      requestedTo: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      originalChore: true,
      alternateChore: true,
    },
  });

  // Swap the assignments
  await prisma.taskAssignment.update({
    where: { id: originalAssignment.id },
    data: { assigneeId: userId },
  });

  await prisma.swapHistory.create({
    data: {
      swapId: swap.id,
      choreId: swap.originalChoreId,
      previousStatus: originalAssignment.status,
      newStatus: TaskStatus.PENDING,
      previousAssignee: swap.requesterId,
      newAssignee: userId,
      changedById: userId,
    },
  });

  // Record the swap in history for the original chore

  if (swap.alternateChoreId) {
    const alternateAssignment = await prisma.taskAssignment.findFirst({
      where: {
        choreId: swap.alternateChoreId,
        assigneeId: swap.requestedToId,
        householdId: swap.householdId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
    });

    if (alternateAssignment) {
      await prisma.taskAssignment.update({
        where: { id: alternateAssignment.id },
        data: { assigneeId: swap.requesterId },
      });

      await prisma.swapHistory.create({
        data: {
          swapId: swap.id,
          choreId: swap.alternateChoreId,
          previousStatus: alternateAssignment.status,
          newStatus: TaskStatus.PENDING,
          previousAssignee: swap.requestedToId,
          newAssignee: swap.requesterId,
          changedById: userId,
        },
      });
    }
  }

  // Award team player points
  await awardPoints(
    userId,
    swap.householdId,
    5,
    'Team Player: Accepted a swap',
    swap.id,
    'chore_swap',
  );

  await createAuditLog({
    householdId: swap.householdId,
    userId,
    action: 'SWAP_ACCEPTED',
    entityType: 'chore_swap',
    entityId: swap.id,
    newValue: { originalChoreId: swap.originalChoreId, alternateChoreId: swap.alternateChoreId },
  });

  return updatedSwap;
}

export async function cancelSwap(swapId: string, userId: string) {
  const swap = await prisma.choreSwap.findUnique({ where: { id: swapId } });

  if (!swap) throw new AppError(404, 'Swap request not found');
  if (swap.requesterId !== userId) {
    throw new AppError(403, 'Only the requester can cancel');
  }
  if (swap.status !== SwapStatus.PENDING) {
    throw new AppError(400, 'Can only cancel pending requests');
  }

  const updated = await prisma.choreSwap.update({
    where: { id: swapId },
    data: { status: SwapStatus.CANCELLED },
  });

  await createAuditLog({
    householdId: swap.householdId,
    userId,
    action: 'SWAP_CANCELLED',
    entityType: 'chore_swap',
    entityId: swapId,
  });

  return updated;
}

export async function adminOverride(swapId: string, userId: string, decision: 'ACCEPTED' | 'DECLINED') {
  const swap = await prisma.choreSwap.findUnique({ where: { id: swapId } });

  if (!swap) throw new AppError(404, 'Swap request not found');

  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: swap.householdId, userId } },
  });

  if (!member || (member.role !== RoleType.OWNER && member.role !== RoleType.ADMIN)) {
    throw new AppError(403, 'Only household admins can override swaps');
  }

  if (decision === 'ACCEPTED') {
    return executeSwapApproval(swap, swap.requestedToId);
  }

  const updated = await prisma.choreSwap.update({
    where: { id: swapId },
    data: { status: SwapStatus.DECLINED, decidedAt: new Date(), adminOverrideId: userId },
  });

  return updated;
}

export async function getSwapsForHousehold(householdId: string, userId: string, status?: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');

  const where: Record<string, unknown> = { householdId };
  if (status) where.status = status as SwapStatus;

  return prisma.choreSwap.findMany({
    where: where as any,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      requestedTo: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      originalChore: true,
      alternateChore: true,
      messages: {
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, displayName: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMySwaps(userId: string, status?: string) {
  const where: Record<string, unknown> = {
    OR: [{ requesterId: userId }, { requestedToId: userId }],
  };
  if (status) where.status = status as SwapStatus;

  return prisma.choreSwap.findMany({
    where: where as any,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      requestedTo: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      originalChore: true,
      alternateChore: true,
      household: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSwapHistory(householdId: string, userId: string, filters?: { status?: string; memberId?: string }) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');

  const where: Record<string, unknown> = { householdId };
  if (filters?.status) where.status = filters.status;
  if (filters?.memberId) {
    where.OR = [{ requesterId: filters.memberId }, { requestedToId: filters.memberId }];
  }

  return prisma.choreSwap.findMany({
    where: where as any,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      requestedTo: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      originalChore: true,
      alternateChore: true,
      history: {
        include: {
          chore: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function sendSwapMessage(swapId: string, userId: string, message: string) {
  const swap = await prisma.choreSwap.findUnique({ where: { id: swapId } });
  if (!swap) throw new AppError(404, 'Swap not found');
  if (swap.requesterId !== userId && swap.requestedToId !== userId) {
    throw new AppError(403, 'Not part of this swap conversation');
  }

  return prisma.swapMessage.create({
    data: {
      swapId,
      senderId: userId,
      message,
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
  });
}
