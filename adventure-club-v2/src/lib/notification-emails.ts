import { prisma } from "@/lib/prisma";
import type { Trek, Registration, User } from "@prisma/client";
import { sendEmail, sendBulkEmails, emailButton, emailShell, getSiteUrl } from "@/lib/email";

function firstName(fullName: string) {
  return fullName.split(" ")[0];
}

function formatTrekDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ===== Trek created -> every verified (ACTIVE) member =====
export async function notifyTrekCreated(trek: Trek) {
  const members = await prisma.user.findMany({
    where: { membershipStatus: "ACTIVE" },
    select: { email: true, fullName: true },
  });

  const url = `${getSiteUrl()}/treks/${trek.id}`;

  await sendBulkEmails(
    members.map((member) => ({
      to: member.email,
      subject: `New Trek Announced: ${trek.title}`,
      html: emailShell(`
        <h2 style="color:#16a34a;">${trek.title}</h2>
        <p>Hi ${firstName(member.fullName)}, a new expedition to ${trek.destination} has just been announced.</p>
        <p>${trek.trekDay} &middot; ${formatTrekDate(trek.date)}</p>
        ${emailButton(url, "View Trek Details")}
      `),
    }))
  );
}

// ===== Registration opens -> everyone who clicked Notify Me =====
// Piggybacked on page visits (no cron in this project): called opportunistically
// whenever a trek's page or the treks list is loaded. Cheap no-op in the
// common case (one findMany) once a trek has already been notified.
export async function notifyRegistrationOpenedIfDue() {
  const dueTreks = await prisma.trek.findMany({
    where: {
      // MongoDB's comparison operators use BSON type-bracketing, so a plain
      // `lte` would also match documents where the field is null — `not: null`
      // rules those back out.
      registrationOpensAt: { lte: new Date(), not: null },
      registrationOpenNotifiedAt: null,
    },
    select: { id: true },
  });

  for (const { id } of dueTreks) {
    await notifyRegistrationOpenForTrek(id);
  }
}

async function notifyRegistrationOpenForTrek(trekId: string) {
  // Atomically claim the send: MongoDB evaluates this filter against the
  // document's state at write time, so if two page views race, only the
  // first one's update actually matches and the second gets count: 0.
  const claimed = await prisma.trek.updateMany({
    where: { id: trekId, registrationOpenNotifiedAt: null },
    data: { registrationOpenNotifiedAt: new Date() },
  });

  if (claimed.count === 0) return;

  const trek = await prisma.trek.findUnique({ where: { id: trekId } });

  if (!trek) return;

  const requests = await prisma.trekNotifyRequest.findMany({ where: { trekId } });

  if (requests.length === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: requests.map((r) => r.userId) } },
    select: { email: true, fullName: true },
  });

  const url = `${getSiteUrl()}/treks/${trekId}`;

  await sendBulkEmails(
    users.map((user) => ({
      to: user.email,
      subject: `Registrations are open: ${trek.title}`,
      html: emailShell(`
        <h2 style="color:#16a34a;">Registrations are now open!</h2>
        <p>Hi ${firstName(user.fullName)}, registrations for <strong>${trek.title}</strong> are now open. Seats are limited, so register soon to secure your spot.</p>
        ${emailButton(url, "Register Now")}
      `),
    }))
  );
}

type RegistrationWithUserAndTrek = Registration & { user: User | null; trek: Trek };

// ===== Registration approved / waitlisted / rejected -> that student =====
export async function notifyRegistrationStatus(registration: RegistrationWithUserAndTrek) {
  if (!registration.user) return; // guest registrations have no account/email

  const { user, trek } = registration;
  const url = `${getSiteUrl()}/treks/${trek.id}`;

  if (registration.status === "APPROVED") {
    const deadline = registration.initialPaymentDeadline
      ? new Date(registration.initialPaymentDeadline).toLocaleString("en-IN")
      : null;

    await sendEmail({
      to: user.email,
      subject: `Registration approved: ${trek.title}`,
      html: emailShell(`
        <h2 style="color:#16a34a;">You're approved!</h2>
        <p>Hi ${firstName(user.fullName)}, your registration for <strong>${trek.title}</strong> has been approved.</p>
        <p>Your initial payment is now open${deadline ? ` — please complete it before ${deadline} to confirm your seat.` : "."}</p>
        ${emailButton(`${getSiteUrl()}/student/payments/${registration.id}`, "Pay Initial Payment")}
      `),
    });
  } else if (registration.status === "WAITLIST") {
    await sendEmail({
      to: user.email,
      subject: `You're on the waitlist: ${trek.title}`,
      html: emailShell(`
        <h2 style="color:#16a34a;">You're on the waitlist</h2>
        <p>Hi ${firstName(user.fullName)}, all seats for <strong>${trek.title}</strong> are currently full. You've been placed on the waiting list and we'll notify you if a seat opens up.</p>
        ${emailButton(url, "View Trek")}
      `),
    });
  } else if (registration.status === "REJECTED") {
    await sendEmail({
      to: user.email,
      subject: `Registration update: ${trek.title}`,
      html: emailShell(`
        <h2 style="color:#dc2626;">Registration not approved</h2>
        <p>Hi ${firstName(user.fullName)}, your registration for <strong>${trek.title}</strong> was not approved this time.</p>
        <p>Please contact Adventure Club SMI for more details.</p>
      `),
    });
  }
}

// ===== Final payment opens -> that student =====
export async function notifyFinalPaymentOpen(registration: RegistrationWithUserAndTrek) {
  if (!registration.user) return;

  const { user, trek } = registration;

  await sendEmail({
    to: user.email,
    subject: `Final payment is open: ${trek.title}`,
    html: emailShell(`
      <h2 style="color:#16a34a;">Final payment is now open</h2>
      <p>Hi ${firstName(user.fullName)}, the final payment for <strong>${trek.title}</strong> is now open.</p>
      ${emailButton(`${getSiteUrl()}/student/payments/${registration.id}`, "Pay Final Payment")}
    `),
  });
}

// ===== Certificate issued -> that student =====
export async function notifyCertificateReady(
  registration: RegistrationWithUserAndTrek,
  certificateUrl: string
) {
  if (!registration.user) return;

  const { user, trek } = registration;

  await sendEmail({
    to: user.email,
    subject: `Your certificate is ready: ${trek.title}`,
    html: emailShell(`
      <h2 style="color:#16a34a;">Your certificate is ready!</h2>
      <p>Hi ${firstName(user.fullName)}, your certificate for <strong>${trek.title}</strong> has been issued.</p>
      ${emailButton(certificateUrl, "View Certificate")}
    `),
  });
}

// ===== Reimbursement processed -> that student =====
export async function notifyReimbursementDone(
  registration: RegistrationWithUserAndTrek,
  amount: number | null
) {
  if (!registration.user) return;

  const { user, trek } = registration;

  await sendEmail({
    to: user.email,
    subject: `Reimbursement processed: ${trek.title}`,
    html: emailShell(`
      <h2 style="color:#16a34a;">Your reimbursement has been processed</h2>
      <p>Hi ${firstName(user.fullName)}, your college reimbursement for <strong>${trek.title}</strong>${amount ? ` of ₹${amount}` : ""} has been processed.</p>
      ${emailButton(`${getSiteUrl()}/dashboard`, "View Dashboard")}
    `),
  });
}
