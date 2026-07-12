import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Stores only the token's hash — the raw value only ever exists in the
// email itself, so a database leak alone can't be used to reset accounts.
export async function createPasswordResetToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

// Single-use: a valid, unexpired match is immediately marked used so the
// same email link can't reset the password twice.
export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}

function getSiteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

export async function sendPasswordResetEmail(email: string, rawToken: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetUrl = `${getSiteUrl()}/reset-password?token=${rawToken}`;

  const result = await resend.emails.send({
    from: "Adventure Club SMI <onboarding@resend.dev>",
    to: email,
    subject: "Reset your Adventure Club password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Reset your password</h2>
        <p>We received a request to reset your Adventure Club SMI password. This link expires in 15 minutes.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:#0d0d0d;font-weight:700;text-decoration:none;border-radius:10px;">
            Reset Password
          </a>
        </p>
        <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  // The SDK returns { data, error } instead of throwing on API-level
  // rejections (bad sender domain, sandbox recipient restrictions, etc.) —
  // without this check a failed send looks identical to a successful one.
  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message}`);
  }
}
