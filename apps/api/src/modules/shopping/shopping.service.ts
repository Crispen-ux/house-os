import { prisma } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';

export async function createList(householdId: string, title: string, description: string | undefined, userId: string) {
  return prisma.shoppingList.create({
    data: { householdId, title, description },
  });
}

export async function getLists(householdId: string, userId: string) {
  await ensureMembership(householdId, userId);
  return prisma.shoppingList.findMany({
    where: { householdId, isActive: true },
    include: {
      items: {
        include: { assignee: { select: { id: true, firstName: true, displayName: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addItem(listId: string, data: {
  name: string; quantity?: number; unit?: string; category?: string; assignedTo?: string; notes?: string; barcode?: string;
}, userId: string) {
  return prisma.shoppingItem.create({
    data: { listId, ...data },
    include: { assignee: { select: { id: true, firstName: true, displayName: true } } },
  });
}

export async function toggleItem(itemId: string, userId: string) {
  const item = await prisma.shoppingItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError(404, 'Item not found');

  return prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      isPurchased: !item.isPurchased,
      purchasedAt: item.isPurchased ? null : new Date(),
    },
  });
}

export async function updateItemPrice(itemId: string, price: number, userId: string) {
  return prisma.shoppingItem.update({
    where: { id: itemId },
    data: { price },
  });
}

async function ensureMembership(householdId: string, userId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a member');
}
