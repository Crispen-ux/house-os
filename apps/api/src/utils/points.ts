import { prisma } from '@house-os/database';

export async function awardPoints(
  userId: string,
  householdId: string,
  points: number,
  reason: string,
  referenceId?: string,
  referenceType?: string,
) {
  await prisma.pointsHistory.create({
    data: {
      userId,
      householdId,
      points,
      reason,
      referenceId,
      referenceType,
    },
  });

  return points;
}

export async function deductPoints(
  userId: string,
  householdId: string,
  points: number,
  reason: string,
  referenceId?: string,
  referenceType?: string,
) {
  await prisma.pointsHistory.create({
    data: {
      userId,
      householdId,
      points: -points,
      reason,
      referenceId,
      referenceType,
    },
  });

  return -points;
}

export async function getUserTotalPoints(userId: string, householdId: string): Promise<number> {
  const result = await prisma.pointsHistory.aggregate({
    where: { userId, householdId },
    _sum: { points: true },
  });
  return result._sum.points || 0;
}
