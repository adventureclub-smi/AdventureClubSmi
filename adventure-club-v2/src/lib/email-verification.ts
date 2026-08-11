import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailShell } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

function hashCode(rawCode: string) {
  return crypto.createHash("sha256").update(rawCode).digest("hex");
}

// A 6-digit code's entropy is defended by the attempt cap/expiry below, not
// by hash slowness — sha256 (same approach as password-reset.ts's tokens)
// is enough since this is only ever compared against a stored hash, never
// used as a password.
function generateCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Overwrites any previous pending code — a fresh signup or "Resend Code"
// click always invalidates whatever code was sent before it.
export async function createEmailVerificationCode(userId: string) {
  const rawCode = generateCode();

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationCodeHash: hashCode(rawCode),
      emailVerificationExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: new Date(),
    },
  });

  return rawCode;
}

export type VerifyCodeResult =
  | "SUCCESS"
  | "ALREADY_VERIFIED"
  | "NO_PENDING_CODE"
  | "EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "INCORRECT";

export async function verifyEmailCode(
  userId: string,
  rawCode: string
): Promise<VerifyCodeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      emailVerificationCodeHash: true,
      emailVerificationExpiresAt: true,
      emailVerificationAttempts: true,
    },
  });

  if (!user) return "NO_PENDING_CODE";
  if (user.emailVerified) return "ALREADY_VERIFIED";

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    return "NO_PENDING_CODE";
  }

  if (user.emailVerificationAttempts >= MAX_ATTEMPTS) {
    return "TOO_MANY_ATTEMPTS";
  }

  if (user.emailVerificationExpiresAt < new Date()) {
    return "EXPIRED";
  }

  if (hashCode(rawCode) !== user.emailVerificationCodeHash) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerificationAttempts: { increment: 1 } },
    });

    return "INCORRECT";
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationAttempts: 0,
    },
  });

  return "SUCCESS";
}

export async function sendEmailVerificationCode(
  email: string,
  fullName: string,
  rawCode: string
) {
  const firstName = fullName.split(" ")[0];

  await sendEmail({
    to: email,
    subject: `Your NAVIRA verification code: ${rawCode}`,
    html: emailShell(`
      <h2 style="color:#008862;">Verify your email</h2>
      <p>Hi ${firstName}, use the code below to verify your NAVIRA SMI account. It expires in 10 minutes.</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0d0d0d;background:#f5f5f5;padding:16px 20px;border-radius:12px;text-align:center;margin:20px 0;">${rawCode}</p>
      <p style="color:#666;font-size:13px;">If you didn't create a NAVIRA account, you can safely ignore this email.</p>
    `),
  });
}
