import type { FastifyBaseLogger } from "fastify";
import { env } from "../config/env.js";

type TeamInviteEmailInput = {
  to: string;
  tenantName: string;
  inviterEmail: string;
  temporaryPassword?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function appBaseUrl(): string {
  if (env.APP_BASE_URL) {
    return env.APP_BASE_URL.replace(/\/$/, "");
  }

  return `${env.PLATFORM_PROTOCOL}://${env.PLATFORM_DOMAIN}`;
}

export async function sendTeamInviteEmail(
  input: TeamInviteEmailInput,
  logger?: FastifyBaseLogger
): Promise<{ sent: boolean }> {
  const temporaryPasswordBlock = input.temporaryPassword
    ? `<p>Your temporary password is:</p>
       <p style="font-size: 20px; letter-spacing: 2px; padding: 12px 16px; background: #f3f0ea; display: inline-block;">${escapeHtml(input.temporaryPassword)}</p>
       <p>You will be asked to change this password after you log in.</p>`
    : "<p>You can log in with your existing Rivo account password.</p>";

  const loginUrl = `${appBaseUrl()}/start`;
  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.5;">
    <main style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
      <h1 style="font-size: 28px; font-weight: 400;">You have been invited to ${escapeHtml(input.tenantName)}</h1>
      <p>${escapeHtml(input.inviterEmail)} invited you to join their Studio team on Rivo.</p>
      <p>Rivo is a portfolio platform for publishing and managing creative work. As a team member, you can help edit the same tenant and keep the portfolio current.</p>
      ${temporaryPasswordBlock}
      <p>
        <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 12px 18px; background: #1c1c1c; color: #ffffff; text-decoration: none;">
          Log in to Rivo
        </a>
      </p>
      <p style="font-size: 13px; color: #666666;">If you were not expecting this invite, you can ignore this email.</p>
    </main>
  </body>
</html>`;

  if (!env.RESEND_API_KEY) {
    const message = "RESEND_API_KEY is not configured; team invite email was not sent.";
    if (env.NODE_ENV === "production") {
      throw new Error(message);
    }

    logger?.warn({ to: input.to, tenantName: input.tenantName }, message);
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: `You're invited to join ${input.tenantName} on Rivo`,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logger?.error({ status: response.status, body }, "Resend team invite email failed");
    throw new Error("Team invite email failed");
  }

  return { sent: true };
}
