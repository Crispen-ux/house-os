import { prisma } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

export async function getUserPoints(userId: string, householdId: string) {
  await ensureMembership(householdId, userId);

  const result = await prisma.pointsHistory.aggregate({
    where: { userId, householdId },
    _sum: { points: true },
  });

  const history = await prisma.pointsHistory.findMany({
    where: { userId, householdId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const totalPoints = result._sum.points || 0;

  const level = Math.floor(totalPoints / 100) + 1;

  return {
    totalPoints,
    level,
    pointsToNextLevel: 100 - (totalPoints % 100),
    history,
  };
}

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });
}

export async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });
}

export async function getAvailableAchievements() {
  return prisma.achievement.findMany({ orderBy: { name: 'asc' } });
}

export async function getAvailableBadges() {
  return prisma.badge.findMany({ orderBy: { name: 'asc' } });
}

async function ensureMembership(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');
}
