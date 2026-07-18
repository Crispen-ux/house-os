import { prisma } from './index';

async function main() {
  const achievements = [
    { key: 'first_chore', name: 'First Chore', description: 'Complete your first chore', points: 10 },
    { key: 'week_streak', name: 'Week Streak', description: 'Complete chores for 7 days straight', points: 50 },
    { key: 'month_streak', name: 'Monthly Streak', description: 'Complete chores for 30 days straight', points: 200 },
    { key: 'team_player', name: 'Team Player', description: 'Accept 5 swap requests', points: 30 },
    { key: 'always_helping', name: 'Always Helping', description: 'Help with 10 extra chores', points: 50 },
    { key: 'flexible_hero', name: 'Flexible Hero', description: 'Swap chores 10 times', points: 75 },
    { key: 'swap_master', name: 'Swap Master', description: 'Complete 25 successful swaps', points: 150 },
    { key: 'perfect_week', name: 'Perfect Week', description: 'Complete all chores for a week', points: 100 },
    { key: 'perfect_month', name: 'Perfect Month', description: 'Complete all chores for a month', points: 500 },
    { key: 'early_bird', name: 'Early Bird', description: 'Complete a chore before 8 AM', points: 15 },
    { key: 'night_owl', name: 'Night Owl', description: 'Complete a chore after 10 PM', points: 15 },
    { key: 'cooking_pro', name: 'Cooking Pro', description: 'Cook 20 meals', points: 100 },
    { key: 'cleaning_champ', name: 'Cleaning Champ', description: 'Complete 50 cleaning chores', points: 150 },
    { key: 'top_scorer_weekly', name: 'Weekly Champion', description: 'Top scorer of the week', points: 200 },
    { key: 'top_scorer_monthly', name: 'Monthly Champion', description: 'Top scorer of the month', points: 500 },
  ];

  const badges = [
    { key: 'bronze_star', name: 'Bronze Star', description: 'Earn 100 points', rarity: 'common' },
    { key: 'silver_star', name: 'Silver Star', description: 'Earn 500 points', rarity: 'uncommon' },
    { key: 'gold_star', name: 'Gold Star', description: 'Earn 1000 points', rarity: 'rare' },
    { key: 'platinum_star', name: 'Platinum Star', description: 'Earn 5000 points', rarity: 'epic' },
    { key: 'diamond_star', name: 'Diamond Star', description: 'Earn 10000 points', rarity: 'legendary' },
    { key: 'helper_badge', name: 'Helper', description: 'Accept 5 swaps', rarity: 'uncommon' },
    { key: 'reliable_badge', name: 'Reliable', description: '30-day streak', rarity: 'rare' },
    { key: 'leader_badge', name: 'Leader', description: 'Top scorer 3 times', rarity: 'epic' },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    });
  }

  // ============================================================
  // Chores — seeded for "The Residence" household
  // Based on the household's weekly/monthly chore chart
  // ============================================================
  const household = await prisma.household.findFirst({
    where: { name: 'The Residence' },
  });

  if (!household) {
    console.warn('Household "The Residence" not found — skipping chore seed. Create the household first.');
  } else {
    const chores = [
      {
        category: 'KITCHEN' as const,
        title: 'Weekday Cooking',
        description: 'Cook dinner on assigned weekday (Mon-Fri)',
        points: 15,
        recurrence: 'DAILY' as const,
        estimatedMinutes: 45,
      },
      {
        category: 'KITCHEN' as const,
        title: 'Dishes',
        description: 'Wash and put away dishes for the day (Mon-Sun)',
        points: 10,
        recurrence: 'DAILY' as const,
        estimatedMinutes: 20,
      },
      {
        category: 'CLEANING' as const,
        title: 'Sweep Common Areas',
        description: 'Sweep living room, hallway, and common areas',
        points: 10,
        recurrence: 'WEEKLY' as const,
        estimatedMinutes: 15,
      },
      {
        category: 'CLEANING' as const,
        title: 'Take Out Rubbish',
        description: 'Take out household rubbish/bins',
        points: 5,
        recurrence: 'WEEKLY' as const,
        estimatedMinutes: 10,
      },
      {
        category: 'CLEANING' as const,
        title: 'Deep Clean Entire House',
        description: 'Monthly rotation: deep clean the whole house',
        points: 40,
        recurrence: 'MONTHLY' as const,
        estimatedMinutes: 120,
      },
      {
        category: 'CLEANING' as const,
        title: 'Clean Kitchen & 4 Bathrooms',
        description: 'Monthly rotation: deep clean kitchen and all bathrooms',
        points: 35,
        recurrence: 'MONTHLY' as const,
        estimatedMinutes: 90,
      },
      {
        category: 'LAUNDRY' as const,
        title: 'Laundry (Wash, Dry, Fold)',
        description: 'Monthly rotation: wash, dry, and fold household laundry',
        points: 25,
        recurrence: 'MONTHLY' as const,
        estimatedMinutes: 60,
      },
      {
        category: 'KITCHEN' as const,
        title: 'Saturday Cooking',
        description: 'Monthly rotation: cook on Saturday',
        points: 20,
        recurrence: 'MONTHLY' as const,
        estimatedMinutes: 60,
      },
    ];

    for (const chore of chores) {
      const existing = await prisma.chore.findFirst({
        where: { householdId: household.id, title: chore.title },
      });
      if (existing) {
        await prisma.chore.update({ where: { id: existing.id }, data: chore });
      } else {
        await prisma.chore.create({ data: { ...chore, householdId: household.id } });
      }
    }

    console.log(`Seeded ${chores.length} chores for household "${household.name}"`);
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
