import { prisma, LeaderboardType } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

export async function getLeaderboard(householdId: string, type: LeaderboardType, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (type === 'WEEKLY') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  } else if (type === 'MONTHLY') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    startDate = new Date(0);
    endDate = new Date(8640000000000000);
  }

  // Find or create leaderboard
  let leaderboard = await prisma.leaderboard.findFirst({
    where: { householdId, type, startDate, endDate },
  });

  if (!leaderboard) {
    leaderboard = await prisma.leaderboard.create({
      data: { householdId, type, startDate, endDate },
    });
  }

  // Calculate points for each member
  const members = await prisma.householdMember.findMany({
    where: { householdId, isActive: true },
    select: { userId: true },
  });

  for (const member of members) {
    const pointsResult = await prisma.pointsHistory.aggregate({
      where: {
        userId: member.userId,
        householdId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { points: true },
    });

    const completedCount = await prisma.taskAssignment.count({
      where: {
        assigneeId: member.userId,
        householdId,
        status: 'COMPLETED',
        completedAt: { gte: startDate, lte: endDate },
      },
    });

    const skippedCount = await prisma.taskAssignment.count({
      where: {
        assigneeId: member.userId,
        householdId,
        status: 'SKIPPED',
        updatedAt: { gte: startDate, lte: endDate },
      },
    });

    const totalPoints = pointsResult._sum.points || 0;

    await prisma.leaderboardEntry.upsert({
      where: {
        leaderboardId_userId: {
          leaderboardId: leaderboard.id,
          userId: member.userId,
        },
      },
      update: {
        totalPoints,
        completedTasks: completedCount,
        skippedTasks: skippedCount,
      },
      create: {
        leaderboardId: leaderboard.id,
        userId: member.userId,
        totalPoints,
        completedTasks: completedCount,
        skippedTasks: skippedCount,
        rank: 0,
      },
    });
  }

  // Update ranks
  const entries = await prisma.leaderboardEntry.findMany({
    where: { leaderboardId: leaderboard.id },
    orderBy: [{ totalPoints: 'desc' }, { completedTasks: 'desc' }],
  });

  for (let i = 0; i < entries.length; i++) {
    await prisma.leaderboardEntry.update({
      where: { id: entries[i].id },
      data: { rank: i + 1 },
    });
  }

  return prisma.leaderboard.findUnique({
    where: { id: leaderboard.id },
    include: {
      entries: {
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
        orderBy: { rank: 'asc' },
      },
    },
  });
}
