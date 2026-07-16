import { prisma, TaskStatus } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

export async function getTaskCompletionReport(householdId: string, startDate: string, endDate: string, userId: string) {
  await ensureMembership(householdId, userId);

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const assignments = await prisma.taskAssignment.findMany({
    where: {
      householdId,
      dueDate: { gte: start, lte: end },
    },
    include: {
      chore: { select: { id: true, title: true, category: true, points: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === TaskStatus.COMPLETED).length;
  const skipped = assignments.filter((a) => a.status === TaskStatus.SKIPPED).length;
  const overdue = assignments.filter((a) => a.status === TaskStatus.OVERDUE).length;
  const pending = assignments.filter((a) => a.status === TaskStatus.PENDING);

  const byCategory: Record<string, { total: number; completed: number }> = {};
  for (const a of assignments) {
    const cat = a.chore.category;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, completed: 0 };
    byCategory[cat].total++;
    if (a.status === TaskStatus.COMPLETED) byCategory[cat].completed++;
  }

  const byMember: Record<string, { total: number; completed: number; points: number; name: string }> = {};
  for (const a of assignments) {
    const id = a.assignee.id;
    if (!byMember[id]) {
      byMember[id] = { total: 0, completed: 0, points: 0, name: a.assignee.displayName || a.assignee.firstName };
    }
    byMember[id].total++;
    if (a.status === TaskStatus.COMPLETED) {
      byMember[id].completed++;
      byMember[id].points += a.chore.points;
    }
  }

  return {
    period: { start: startDate, end: endDate },
    summary: { total, completed, skipped, overdue, pending: pending.length },
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory,
    byMember: Object.entries(byMember).map(([id, data]) => ({ id, ...data })),
  };
}

export async function getMemberPerformance(householdId: string, memberId: string, startDate: string, endDate: string, userId: string) {
  await ensureMembership(householdId, userId);

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const assignments = await prisma.taskAssignment.findMany({
    where: {
      householdId,
      assigneeId: memberId,
      dueDate: { gte: start, lte: end },
    },
    include: {
      chore: { select: { id: true, title: true, category: true, points: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const pointsResult = await prisma.pointsHistory.aggregate({
    where: {
      userId: memberId,
      householdId,
      createdAt: { gte: start, lte: end },
    },
    _sum: { points: true },
  });

  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === TaskStatus.COMPLETED).length;
  const skipped = assignments.filter((a) => a.status === TaskStatus.SKIPPED).length;

  return {
    memberId,
    period: { start: startDate, end: endDate },
    summary: { total, completed, skipped, points: pointsResult._sum.points || 0 },
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    streak: await calculateStreak(memberId, householdId),
    tasks: assignments,
  };
}

export async function getDashboardStats(householdId: string, userId: string) {
  await ensureMembership(householdId, userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAssignments = await prisma.taskAssignment.findMany({
    where: {
      householdId,
      dueDate: { gte: today, lt: tomorrow },
    },
    include: {
      chore: true,
      assignee: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const todayTotal = todayAssignments.length;
  const todayCompleted = todayAssignments.filter((a) => a.status === TaskStatus.COMPLETED).length;
  const progressPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  const cookingTasks = todayAssignments.filter((a) => a.chore.category === 'KITCHEN');
  const dishesTasks = todayAssignments.filter((a) => a.chore.title.toLowerCase().includes('dishes') || a.chore.title.toLowerCase().includes('dish'));

  const upcomingTasks = await prisma.taskAssignment.findMany({
    where: {
      householdId,
      dueDate: { gte: tomorrow },
      status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
    },
    include: {
      chore: true,
      assignee: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });

  const recentLogs = await prisma.auditLog.findMany({
    where: { householdId },
    include: { user: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const recentNotifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const members = await prisma.householdMember.findMany({
    where: { householdId, isActive: true },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, displayName: true, dateOfBirth: true, avatarUrl: true } },
    },
  });

  const upcomingBirthdays = members
    .filter((m) => m.user.dateOfBirth)
    .map((m) => m.user)
    .filter((u) => {
      if (!u.dateOfBirth) return false;
      const today2 = new Date();
      const bdayThisYear = new Date(today2.getFullYear(), u.dateOfBirth.getMonth(), u.dateOfBirth.getDate());
      const diff = bdayThisYear.getTime() - today2.getTime();
      return diff >= 0 && diff <= 14 * 24 * 60 * 60 * 1000;
    });

  return {
    todayDate: today.toISOString().split('T')[0],
    todayCooking: cookingTasks,
    todayDishes: dishesTasks,
    todayChores: todayAssignments,
    upcomingTasks,
    progressPercent,
    householdActivity: recentLogs,
    recentNotifications,
    upcomingBirthdays,
  };
}

async function calculateStreak(userId: string, householdId: string): Promise<number> {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await prisma.taskAssignment.count({
      where: {
        assigneeId: userId,
        householdId,
        completedAt: { gte: day, lt: nextDay },
      },
    });

    if (count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function ensureMembership(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');
}
