import { prisma, RoleType } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';

export async function createHousehold(name: string, description: string | undefined, ownerId: string) {
  const household = await prisma.household.create({
    data: {
      name,
      description,
      ownerId,
    },
  });

  await prisma.householdMember.create({
    data: {
      householdId: household.id,
      userId: ownerId,
      role: RoleType.OWNER,
    },
  });

  await prisma.householdSetting.create({
    data: { householdId: household.id },
  });

  await createAuditLog({
    householdId: household.id,
    userId: ownerId,
    action: 'HOUSEHOLD_CREATED',
    entityType: 'household',
    entityId: household.id,
    newValue: { name },
  });

  return household;
}

export async function getHousehold(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });

  if (!member) throw new AppError(403, 'Not a member of this household');

  return prisma.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      settings: true,
    },
  });
}

export async function getUserHouseholds(userId: string) {
  return prisma.household.findMany({
    where: {
      members: {
        some: { userId, isActive: true },
      },
    },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}

export async function updateMemberRole(householdId: string, userId: string, targetUserId: string, role: RoleType) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });

  if (!member || (member.role !== RoleType.OWNER && member.role !== RoleType.ADMIN)) {
    throw new AppError(403, 'Only owners and admins can change roles');
  }

  if (targetUserId === member.userId) {
    throw new AppError(400, 'Cannot change your own role');
  }

  const target = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: targetUserId } },
  });

  if (!target) throw new AppError(404, 'Member not found');

  const updated = await prisma.householdMember.update({
    where: { id: target.id },
    data: { role },
  });

  await createAuditLog({
    householdId,
    userId,
    action: 'MEMBER_ROLE_CHANGED',
    entityType: 'household_member',
    entityId: target.id,
    oldValue: { role: target.role },
    newValue: { role },
  });

  return updated;
}

export async function removeMember(householdId: string, userId: string, targetUserId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });

  if (!member || (member.role !== RoleType.OWNER && member.role !== RoleType.ADMIN)) {
    throw new AppError(403, 'Only owners and admins can remove members');
  }

  const target = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: targetUserId } },
  });

  if (!target) throw new AppError(404, 'Member not found');
  if (target.role === RoleType.OWNER) throw new AppError(400, 'Cannot remove the owner');

  await prisma.householdMember.update({
    where: { id: target.id },
    data: { isActive: false },
  });

  await createAuditLog({
    householdId,
    userId,
    action: 'MEMBER_REMOVED',
    entityType: 'household_member',
    entityId: target.id,
    oldValue: { userId: targetUserId },
  });
}
