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
