import { Resend } from "resend";

const FROM = "Adventure Club SMI <noreply@adventureclubsmi.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function getSiteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

export function emailButton(href: string, label: string) {
  return `
    <p>
      <a href="${href}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:#0d0d0d;font-weight:700;text-decoration:none;border-radius:10px;">
        ${label}
      </a>
    </p>
  `;
}

export function emailShell(bodyHtml: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      ${bodyHtml}
      <p style="color:#999;font-size:12px;margin-top:32px;">Adventure Club SMI</p>
    </div>
  `;
}

// The SDK returns { data, error } instead of throwing on API-level rejections
// (bad sender domain, sandbox recipient restrictions, etc.) — without this
// check a failed send looks identical to a successful one.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const result = await getResend().emails.send({ from: FROM, to, subject, html });

  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message}`);
  }
}

// One email per recipient — never a shared `to` array, which would expose
// every recipient's address to everyone else on the send. Uses Resend's
// batch endpoint (up to 100 per call) with permissive validation so one bad
// address doesn't drop the rest of the batch. These are background
// notification fan-outs rather than user-facing request/response flows, so
// failures are logged rather than thrown.
export async function sendBulkEmails(
  emails: { to: string; subject: string; html: string }[]
) {
  if (emails.length === 0) return;

  const resend = getResend();
  const BATCH_SIZE = 100;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    try {
      const result = await resend.batch.send(
        chunk.map((e) => ({ from: FROM, to: e.to, subject: e.subject, html: e.html })),
        { batchValidation: "permissive" }
      );

      if (result.error) {
        console.error("Resend batch API error:", result.error);
      }
    } catch (error) {
      console.error("Failed to send email batch:", error);
    }
  }
}
