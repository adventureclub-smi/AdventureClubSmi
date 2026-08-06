const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Display name only — the domain stays as-is since it's a verified sending
// domain; switching it would break all outgoing email until a new domain is
// set up and verified with whatever provider replaces this one.
const FROM_EMAIL = "noreply@adventureclubsmi.com";
const FROM_NAME = "NAVIRA SMI";

function brevoHeaders() {
  return {
    "api-key": process.env.BREVO_API_KEY!,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function getSiteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

// Admin-authored broadcast subjects/messages get interpolated straight into
// an HTML email body — escaping keeps a stray "<" or "&" from breaking the
// layout (or, worse, being interpreted as markup) instead of just showing up
// as literal text like the admin intended.
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailButton(href: string, label: string) {
  return `
    <p>
      <a href="${href}" style="display:inline-block;padding:12px 24px;background:#00a073;color:#0d0d0d;font-weight:700;text-decoration:none;border-radius:10px;">
        ${label}
      </a>
    </p>
  `;
}

export function emailShell(bodyHtml: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      ${bodyHtml}
      <p style="color:#999;font-size:12px;margin-top:32px;">NAVIRA SMI</p>
    </div>
  `;
}

// Brevo returns a non-2xx status with a JSON { code, message } body on
// failure rather than throwing — without checking res.ok a failed send
// looks identical to a successful one.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: brevoHeaders(),
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }
}

// One email per recipient — never a shared `to` array, which would expose
// every recipient's address to everyone else on the send. Brevo's
// `messageVersions` sends each entry as its own individual email in a
// single API call (capped well under its documented 2000-recipient/request
// ceiling here, chunked defensively) — recipients never see each other.
// These are background notification fan-outs rather than user-facing
// request/response flows, so failures are logged rather than thrown.
export async function sendBulkEmails(
  emails: { to: string; subject: string; html: string }[]
) {
  if (emails.length === 0) return;

  const BATCH_SIZE = 100;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    try {
      const res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: brevoHeaders(),
        body: JSON.stringify({
          sender: { email: FROM_EMAIL, name: FROM_NAME },
          // Brevo requires top-level subject/htmlContent even when every
          // messageVersion below overrides both — these two are never
          // actually sent to anyone, just the required fallback.
          subject: chunk[0].subject,
          htmlContent: chunk[0].html,
          messageVersions: chunk.map((e) => ({
            to: [{ email: e.to }],
            subject: e.subject,
            htmlContent: e.html,
          })),
        }),
      });

      if (!res.ok) {
        console.error("Brevo batch API error:", res.status, await res.text());
      }
    } catch (error) {
      console.error("Failed to send email batch:", error);
    }
  }
}
