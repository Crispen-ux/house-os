import { prisma, NotificationChannel } from '@house-os/database';
import { config } from '@house-os/config';

export async function createNotification(
  userId: string,
  channel: NotificationChannel,
  title: string,
  body?: string,
  data?: Record<string, unknown>,
) {
  const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'PUSH',
        channel,
        title,
        body,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      },
  });

  // Attempt to send via configured channels
  const settings = await prisma.userSetting.findUnique({ where: { userId } });

  if (settings?.pushEnabled) {
    sendPushNotification(userId, title, body).catch(console.error);
  }
  if (settings?.whatsappEnabled) {
    sendWhatsAppNotification(userId, title, body).catch(console.error);
  }
  if (settings?.emailEnabled) {
    sendEmailNotification(userId, title, body).catch(console.error);
  }

  return notification;
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getNotifications(userId: string, unreadOnly = false) {
  const where: Record<string, unknown> = { userId };
  if (unreadOnly) where.isRead = false;

  return prisma.notification.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

async function sendPushNotification(userId: string, title: string, body?: string) {
  // Firebase push notification integration
  const settings = await prisma.userSetting.findUnique({ where: { userId } });
  if (!settings?.fcmToken) return;

  const serverKey = config.notifications.firebase.serverKey;
  if (!serverKey) return;

  try {
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: settings.fcmToken,
        notification: { title, body },
        data: { click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      }),
    });
  } catch (error) {
    console.error('FCM push failed:', error);
  }
}

async function sendWhatsAppNotification(userId: string, title: string, body?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) return;

  const apiUrl = config.notifications.whatsapp.url;
  const apiKey = config.notifications.whatsapp.apiKey;
  if (!apiUrl || !apiKey) return;

  try {
    await fetch(`${apiUrl}/message/sendText/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: user.phone,
        text: `*${title}*\n${body || ''}`,
      }),
    });
  } catch (error) {
    console.error('WhatsApp notification failed:', error);
  }
}

async function sendEmailNotification(userId: string, title: string, body?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.notifications.email.host,
      port: config.notifications.email.port,
      auth: {
        user: config.notifications.email.user,
        pass: config.notifications.email.pass,
      },
    });

    await transporter.sendMail({
      from: config.notifications.email.from,
      to: user.email,
      subject: title,
      text: body || title,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>${body || ''}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Household OS</p>
      </div>`,
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
}
