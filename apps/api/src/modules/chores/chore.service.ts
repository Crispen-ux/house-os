import { prisma, TaskStatus, RoleType } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';
import { awardPoints, deductPoints } from '../../utils/points';
import { CreateChoreInput, AssignChoreInput } from '@house-os/types';

export async function createChore(input: CreateChoreInput, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: input.householdId, userId } },
  });

  if (!member || (member.role !== RoleType.OWNER && member.role !== RoleType.ADMIN && member.role !== RoleType.ADULT)) {
    throw new AppError(403, 'Insufficient permissions to create chores');
  }

  const chore = await prisma.chore.create({
    data: {
      householdId: input.householdId,
      category: input.category,
      customCategory: input.customCategory,
      title: input.title,
      description: input.description,
      instructions: input.instructions,
      points: input.points ?? 10,
      penaltyPoints: input.penaltyPoints ?? 0,
      recurrence: input.recurrence,
      isRestricted: input.isRestricted ?? false,
      requiresAdult: input.requiresAdult ?? false,
      estimatedMinutes: input.estimatedMinutes,
    },
  });

  await createAuditLog({
    householdId: input.householdId,
    userId,
    action: 'CHORE_CREATED',
    entityType: 'chore',
    entityId: chore.id,
    newValue: { title: chore.title, category: chore.category },
  });

  return chore;
}

export async function getHouseholdChores(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');

  return prisma.chore.findMany({
    where: { householdId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assignChore(input: AssignChoreInput, userId: string) {
  const assignment = await prisma.taskAssignment.create({
    data: {
      choreId: input.choreId,
      assigneeId: input.assigneeId,
      householdId: (await prisma.chore.findUniqueOrThrow({ where: { id: input.choreId } })).householdId,
      dueDate: new Date(input.dueDate),
    },
    include: {
      chore: true,
      assignee: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
  });

  await createAuditLog({
    householdId: assignment.householdId,
    userId,
    action: 'TASK_ASSIGNED',
    entityType: 'task_assignment',
    entityId: assignment.id,
    newValue: { choreId: input.choreId, assigneeId: input.assigneeId, dueDate: input.dueDate },
  });

  return assignment;
}

export async function getAssignments(householdId: string, userId: string, date?: string, status?: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');

  const where: Record<string, unknown> = { householdId };

  if (date) {
    const d = new Date(date);
    where.dueDate = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }
  if (status) {
    where.status = status as TaskStatus;
  }

  return prisma.taskAssignment.findMany({
    where: where as any,
    include: {
      chore: true,
      assignee: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function getMyAssignments(userId: string, status?: string) {
  const where: Record<string, unknown> = { assigneeId: userId };
  if (status) where.status = status as TaskStatus;

  return prisma.taskAssignment.findMany({
    where: where as any,
    include: {
      chore: true,
      household: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function completeTask(assignmentId: string, userId: string) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { chore: true },
  });

  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.assigneeId !== userId) {
    throw new AppError(403, 'You can only complete your own tasks');
  }
  if (assignment.status === TaskStatus.COMPLETED) {
    throw new AppError(400, 'Task already completed');
  }

  const updated = await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
  });

  await awardPoints(
    userId,
    assignment.householdId,
    assignment.chore.points,
    `Completed: ${assignment.chore.title}`,
    assignmentId,
    'task_assignment',
  );

  await createAuditLog({
    householdId: assignment.householdId,
    userId,
    action: 'TASK_COMPLETED',
    entityType: 'task_assignment',
    entityId: assignmentId,
    newValue: { status: TaskStatus.COMPLETED, points: assignment.chore.points },
  });

  return updated;
}

export async function skipTask(assignmentId: string, userId: string, reason?: string) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { chore: true },
  });

  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.assigneeId !== userId) {
    throw new AppError(403, 'You can only skip your own tasks');
  }

  const updated = await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: { status: TaskStatus.SKIPPED, notes: reason },
  });

  if (assignment.chore.penaltyPoints > 0) {
    await deductPoints(
      userId,
      assignment.householdId,
      assignment.chore.penaltyPoints,
      `Skipped: ${assignment.chore.title}`,
      assignmentId,
      'task_assignment',
    );
  }

  await createAuditLog({
    householdId: assignment.householdId,
    userId,
    action: 'TASK_SKIPPED',
    entityType: 'task_assignment',
    entityId: assignmentId,
    newValue: { status: TaskStatus.SKIPPED, reason },
  });

  return updated;
}

export async function updateChore(choreId: string, data: Partial<CreateChoreInput>, userId: string) {
  const chore = await prisma.chore.findUnique({ where: { id: choreId } });
  if (!chore) throw new AppError(404, 'Chore not found');

  const updated = await prisma.chore.update({
    where: { id: choreId },
    data,
  });

  await createAuditLog({
    householdId: chore.householdId,
    userId,
    action: 'CHORE_UPDATED',
    entityType: 'chore',
    entityId: choreId,
    oldValue: { title: chore.title },
    newValue: data,
  });

  return updated;
}

export async function deleteChore(choreId: string, userId: string) {
  const chore = await prisma.chore.findUnique({ where: { id: choreId } });
  if (!chore) throw new AppError(404, 'Chore not found');

  await prisma.chore.update({
    where: { id: choreId },
    data: { isActive: false },
  });

  await createAuditLog({
    householdId: chore.householdId,
    userId,
    action: 'CHORE_DELETED',
    entityType: 'chore',
    entityId: choreId,
    oldValue: { title: chore.title },
  });
}
