import { prisma, TaskStatus, RoleType } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';

export async function createRotation(
  householdId: string,
  name: string,
  description: string | undefined,
  startDate: string,
  cycleDays: number,
  userId: string,
) {
  const rotation = await prisma.rotation.create({
    data: {
      householdId,
      name,
      description,
      startDate: new Date(startDate),
      cycleDays,
    },
  });

  await createAuditLog({
    householdId,
    userId,
    action: 'ROTATION_CREATED',
    entityType: 'rotation',
    entityId: rotation.id,
    newValue: { name, cycleDays },
  });

  return rotation;
}

export async function addRotationRule(
  rotationId: string,
  choreId: string,
  memberId: string,
  position: number,
  userId: string,
) {
  const rotation = await prisma.rotation.findUnique({ where: { id: rotationId } });
  if (!rotation) throw new AppError(404, 'Rotation not found');

  const rule = await prisma.rotationRule.create({
    data: { rotationId, choreId, memberId, position },
    include: {
      chore: { select: { id: true, title: true } },
      member: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
  });

  await createAuditLog({
    householdId: rotation.householdId,
    userId,
    action: 'ROTATION_RULE_ADDED',
    entityType: 'rotation_rule',
    entityId: rule.id,
    newValue: { rotationId, choreId, memberId, position },
  });

  return rule;
}

export async function getRotations(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');

  return prisma.rotation.findMany({
    where: { householdId, isActive: true },
    include: {
      rules: {
        include: {
          chore: { select: { id: true, title: true, points: true } },
          member: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

export async function rotateNow(rotationId: string, userId: string) {
  const rotation = await prisma.rotation.findUnique({
    where: { id: rotationId },
    include: {
      rules: {
        include: {
          member: { select: { id: true } },
          chore: { select: { id: true, householdId: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!rotation) throw new AppError(404, 'Rotation not found');

  const rules = rotation.rules;
  if (rules.length === 0) throw new AppError(400, 'No rules defined');

  const memberIds = [...new Set(rules.map((r) => r.member.id))];
  const choreIds = [...new Set(rules.map((r) => r.chore.id))];

  // Simple rotation: shift members forward
  const shiftedIds = [...memberIds.slice(1), ...memberIds.slice(0, 1)];

  // Remove existing assignments for these chores in this rotation
  await prisma.taskAssignment.deleteMany({
    where: {
      rotationId,
      status: { in: [TaskStatus.PENDING] },
    },
  });

  // Create new assignments
  const assignments = [];
  const today = new Date();
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const choreIndex = choreIds.indexOf(rule.chore.id);
    const assigneeIndex = choreIndex % shiftedIds.length;
    const assigneeId = shiftedIds[assigneeIndex];

    // Handle case where multiple rules reference different chores
    const ruleChoreIndex = rules.filter((r) => r.chore.id === rule.chore.id).indexOf(rule);
    const memberIdx = (rule.position - 1) % memberIds.length;
    const newAssigneeId = shiftedIds[memberIdx] || assigneeId;

    const assignment = await prisma.taskAssignment.create({
      data: {
        choreId: rule.chore.id,
        assigneeId: newAssigneeId,
        householdId: rule.chore.householdId,
        dueDate: new Date(today.getTime() + rotation.cycleDays * 24 * 60 * 60 * 1000),
        rotationId,
      },
    });
    assignments.push(assignment);
  }

  // Update rotation start date
  await prisma.rotation.update({
    where: { id: rotationId },
    data: { startDate: today },
  });

  await createAuditLog({
    householdId: rotation.householdId,
    userId,
    action: 'ROTATION_EXECUTED',
    entityType: 'rotation',
    entityId: rotationId,
  });

  return assignments;
}
