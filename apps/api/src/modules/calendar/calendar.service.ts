import { prisma } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

export async function getCalendarEvents(
  householdId: string,
  startDate: string,
  endDate: string,
  userId: string,
) {
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
      assignee: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      householdId,
      date: { gte: start, lte: end },
    },
    include: {
      recipe: { select: { id: true, title: true } },
      cook: { select: { id: true, firstName: true, displayName: true } },
    },
    orderBy: { date: 'asc' },
  });

  const events = [
    ...assignments.map((a) => ({
      id: a.id,
      type: 'task' as const,
      title: a.chore.title,
      date: a.dueDate.toISOString().split('T')[0],
      status: a.status,
      assignee: a.assignee,
      chore: a.chore,
    })),
    ...mealPlans.map((m) => ({
      id: m.id,
      type: 'meal' as const,
      title: `${m.mealType}: ${m.title}`,
      date: m.date.toISOString().split('T')[0],
      cook: m.cook,
      recipe: m.recipe,
    })),
  ];

  events.sort((a, b) => a.date.localeCompare(b.date));

  return events;
}

async function ensureMembership(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');
}
