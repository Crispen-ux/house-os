import { RoleType } from '@house-os/database';
import { config } from '@house-os/config';

interface InvitationEmailData {
  to: string;
  householdName: string;
  inviterName: string;
  token: string;
  role: RoleType;
  message?: string;
  expiresAt: Date;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  if (!config.notifications.email.user || !config.notifications.email.pass) {
    console.log('SMTP not configured, skipping invitation email');
    return;
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.notifications.email.host,
    port: config.notifications.email.port,
    auth: {
      user: config.notifications.email.user,
      pass: config.notifications.email.pass,
    },
  });

  const inviteUrl = `${config.app.url}/invitations/${data.token}`;
  const roleLabel = data.role.charAt(0) + data.role.slice(1).toLowerCase();
  const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await transporter.sendMail({
    from: config.notifications.email.from,
    to: data.to,
    subject: `You're invited to join ${data.householdName}`,
    text: `${data.inviterName} has invited you to join "${data.householdName}" as a ${roleLabel}.\n\n${data.message ? `Message: ${data.message}\n\n` : ''}Accept your invitation: ${inviteUrl}\n\nThis invitation expires on ${expiryDate}.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #f0f0f0;">
            <span style="font-size: 24px;">🏠</span>
          </div>
        </div>
        <h1 style="font-size: 20px; font-weight: 600; text-align: center; margin: 0 0 8px;">You're invited to join ${data.householdName}</h1>
        <p style="color: #666; text-align: center; margin: 0 0 24px; font-size: 14px;">
          ${data.inviterName} has invited you as a <strong>${roleLabel}</strong>
        </p>
        ${data.message ? `
          <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #333; margin: 0; font-size: 14px; font-style: italic;">"${data.message}"</p>
          </div>
        ` : ''}
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${inviteUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #999; text-align: center; font-size: 12px; margin: 0;">
          This invitation expires on ${expiryDate}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #bbb; text-align: center; font-size: 11px; margin: 0;">Household OS</p>
      </div>
    `,
  });
}

export async function sendInvitationAcceptedEmail(inviterEmail: string, inviterName: string, memberEmail: string, householdName: string) {
  if (!config.notifications.email.user || !config.notifications.email.pass) return;

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
    to: inviterEmail,
    subject: `${memberEmail} joined ${householdName}`,
    text: `${memberEmail} has accepted your invitation and joined "${householdName}".`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">New member joined!</h2>
        <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
          ${memberEmail} has accepted your invitation and joined <strong>${householdName}</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #bbb; text-align: center; font-size: 11px; margin: 0;">Household OS</p>
      </div>
    `,
  });
}
