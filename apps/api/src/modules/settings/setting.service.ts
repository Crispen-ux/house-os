import { prisma } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

export async function getUserSettings(userId: string) {
  let settings = await prisma.userSetting.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSetting.create({ data: { userId } });
  }
  return settings;
}

export async function updateUserSettings(userId: string, data: {
  theme?: string;
  language?: string;
  timezone?: string;
  morningReminder?: boolean;
  eveningReminder?: boolean;
  overdueReminder?: boolean;
  pushEnabled?: boolean;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  fcmToken?: string;
}) {
  return prisma.userSetting.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function getHouseholdSettings(householdId: string, userId: string) {
  await ensureMembership(householdId, userId);

  let settings = await prisma.householdSetting.findUnique({ where: { householdId } });
  if (!settings) {
    settings = await prisma.householdSetting.create({ data: { householdId } });
  }
  return settings;
}

export async function updateHouseholdSettings(householdId: string, userId: string, data: {
  requireAdminForSwaps?: boolean;
  allowChildrenSwaps?: boolean;
  defaultPoints?: number;
  morningReminderTime?: string;
  eveningReminderTime?: string;
}) {
  await ensureMembership(householdId, userId);

  return prisma.householdSetting.upsert({
    where: { householdId },
    update: data,
    create: { householdId, ...data },
  });
}

async function ensureMembership(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');
}
