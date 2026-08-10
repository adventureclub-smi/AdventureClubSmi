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
        <h2 style="color:#008862;">${trek.title}</h2>
        <p>Hi ${firstName(member.fullName)}, a new expedition to ${trek.destination} has just been announced.</p>
        <p>${trek.trekDay} &middot; ${formatTrekDate(trek.date)}</p>
        ${emailButton(url, "View Trek Details")}
      `),
    }))
  );
}

// ===== Workshop created -> every verified (ACTIVE) member =====
// Separate from notifyTrekCreated since its copy ("expedition to
// {destination}") reads wrong for an on-campus workshop.
export async function notifyWorkshopCreated(workshop: Trek) {
  const members = await prisma.user.findMany({
    where: { membershipStatus: "ACTIVE" },
    select: { email: true, fullName: true },
  });

  const url = `${getSiteUrl()}/treks/${workshop.id}`;
  const isFree = workshop.price === 0;

  await sendBulkEmails(
    members.map((member) => ({
      to: member.email,
      subject: `New Workshop Announced: ${workshop.title}`,
      html: emailShell(`
        <h2 style="color:#008862;">${workshop.title}</h2>
        <p>Hi ${firstName(member.fullName)}, a new workshop at ${workshop.destination} has just been announced.</p>
        <p>${formatTrekDate(workshop.date)}${workshop.time ? ` &middot; ${workshop.time}` : ""}</p>
        <p>${isFree ? "Free to attend." : `Registration fee: ₹${workshop.price}`}</p>
        ${emailButton(url, "View Workshop Details")}
      `),
    }))
  );
}

// Every member's dateOfBirth is saved from a plain "YYYY-MM-DD" <input
// type="date">, which `new Date(...)` anchors to UTC midnight — reading it
// back with getUTCMonth()/getUTCDate() returns exactly the calendar date
// that was entered, regardless of what timezone the server process runs in.
// "Today" needs the same UTC-field trick applied to a shifted instant, since
// every member is in India (UTC+5:30) but Vercel's server clock is UTC.
function istTodayParts() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(Date.now() + IST_OFFSET_MS);

  return {
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    year: ist.getUTCFullYear(),
  };
}

// ===== Birthday -> that member, once per calendar year =====
// Piggybacked on homepage visits (no cron in this project), same as the
// registration-open check below. Cheap no-op once everyone whose birthday is
// today has already been wished this year.
export async function notifyBirthdaysIfDue() {
  const { month, day, year } = istTodayParts();

  const members = await prisma.user.findMany({
    where: {
      membershipStatus: "ACTIVE",
      dateOfBirth: { not: null },
      lastBirthdayEmailYear: { not: year },
    },
    select: { id: true, email: true, fullName: true, dateOfBirth: true },
  });

  const dueToday = members.filter((member) => {
    const dob = member.dateOfBirth!;
    return dob.getUTCMonth() === month && dob.getUTCDate() === day;
  });

  for (const member of dueToday) {
    await sendBirthdayEmail(member, year);
  }
}

async function sendBirthdayEmail(
  member: { id: string; email: string; fullName: string },
  year: number
) {
  // Atomically claim the send: MongoDB evaluates this filter against the
  // document's state at write time, so if two page views race, only the
  // first one's update actually matches and the second gets count: 0.
  const claimed = await prisma.user.updateMany({
    where: { id: member.id, lastBirthdayEmailYear: { not: year } },
    data: { lastBirthdayEmailYear: year },
  });

  if (claimed.count === 0) return;

  await sendEmail({
    to: member.email,
    subject: `Happy Birthday, ${firstName(member.fullName)}! 🎂 — from NAVIRA`,
    html: emailShell(`
      <h2 style="color:#008862;">Happy Birthday, ${firstName(member.fullName)}! 🏔️</h2>
      <p>Wishing you a year ahead filled with new trails to discover, peaks to chase, and unforgettable sunrises above the clouds.</p>
      <p>May the mountains keep calling and the adventures keep coming — here's to another year of exploring the wild with the people who make it unforgettable.</p>
      <p>Have a wonderful day, from your family at NAVIRA. 🌲</p>
    `),
  });
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
        <h2 style="color:#008862;">Registrations are now open!</h2>
        <p>Hi ${firstName(user.fullName)}, registrations for <strong>${trek.title}</strong> are now open. Seats are limited, so register soon to secure your spot.</p>
        ${emailButton(url, "Register Now")}
      `),
    }))
  );
}

type RegistrationWithUserAndTrek = Registration & { user: User | null; trek: Trek };

// ===== Account created -> that student =====
export async function notifyAccountCreated(user: { email: string; fullName: string; clubId: string }) {
  await sendEmail({
    to: user.email,
    subject: "Welcome to NAVIRA SMI — your account is ready",
    html: emailShell(`
      <h2 style="color:#008862;">Welcome to NAVIRA, ${firstName(user.fullName)}!</h2>
      <p>Your account has been created successfully. Your club ID is <strong>${user.clubId}</strong>.</p>
      <p>You can now log in, browse upcoming treks, and register whenever you're ready.</p>
      ${emailButton(`${getSiteUrl()}/login`, "Log In")}
    `),
  });
}

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
        <h2 style="color:#008862;">You're approved!</h2>
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
        <h2 style="color:#008862;">You're on the waitlist</h2>
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
        <p>Please contact NAVIRA SMI for more details.</p>
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
      <h2 style="color:#008862;">Final payment is now open</h2>
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
      <h2 style="color:#008862;">Your certificate is ready!</h2>
      <p>Hi ${firstName(user.fullName)}, your certificate for <strong>${trek.title}</strong> has been issued.</p>
      ${emailButton(certificateUrl, "View Certificate")}
    `),
  });
}

// ===== Status and/or club role changed by an admin -> that student =====
export async function notifyMembershipUpdated(
  user: { email: string; fullName: string },
  changed: { membershipStatus: boolean; clubRole: boolean },
  newMembershipStatus?: string
) {
  // Becoming Active is the common case (approving a new sign-up) and gets
  // its own copy nudging the student toward the "Registered Member" role,
  // which an admin only grants once a profile is actually filled in.
  if (changed.membershipStatus && newMembershipStatus === "ACTIVE") {
    await sendEmail({
      to: user.email,
      subject: "Your NAVIRA account status is Active",
      html: emailShell(`
        <h2 style="color:#008862;">Your account status is "Active"!</h2>
        <p>Hi ${firstName(user.fullName)}, your account status on NAVIRA is now <strong>Active</strong>.</p>
        <p>It'd be appreciated if you could complete your profile — doing so gets you the <strong>"Registered Member"</strong> role.</p>
        ${emailButton(`${getSiteUrl()}/dashboard/profile`, "Complete Profile")}
      `),
    });
    return;
  }

  const parts = [
    changed.membershipStatus && "status",
    changed.clubRole && "club role",
  ].filter(Boolean);

  if (parts.length === 0) return;

  await sendEmail({
    to: user.email,
    subject: "Your NAVIRA profile has been updated",
    html: emailShell(`
      <h2 style="color:#008862;">Your ${parts.join(" and ")} has been updated</h2>
      <p>Hi ${firstName(user.fullName)}, your ${parts.join(" and ")} on NAVIRA has just been updated by an admin. Please check your profile for the latest details.</p>
      ${emailButton(`${getSiteUrl()}/dashboard/profile`, "View Profile")}
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
      <h2 style="color:#008862;">Your reimbursement has been processed</h2>
      <p>Hi ${firstName(user.fullName)}, your college reimbursement for <strong>${trek.title}</strong>${amount ? ` of ₹${amount}` : ""} has been processed.</p>
      ${emailButton(`${getSiteUrl()}/dashboard`, "View Dashboard")}
    `),
  });
}
