import fs from "fs";
import path from "path";
import type { Browser } from "puppeteer-core";

export type CertificateData = {
  studentName: string;
  trekName: string;
  date: string;
  place: string;
  facultyHeadName?: string | null;
  facultyHeadSignatureUrl?: string | null;
  presidentName?: string | null;
  presidentSignatureUrl?: string | null;
};

const CERT_DIR = path.join(process.cwd(), "src", "lib", "certificate");

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function signatureBlock(name: string, signatureUrl?: string | null) {
  if (signatureUrl) {
    return `<img src="${signatureUrl}" alt="${escapeHtml(name)} signature">`;
  }
  return `<div class="sig-placeholder">Signature not yet uploaded</div>`;
}

function logoDataUri() {
  const logoPath = path.join(CERT_DIR, "assets", "logo.png");
  const buffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function buildHtml(data: CertificateData) {
  const template = fs.readFileSync(path.join(CERT_DIR, "template.html"), "utf-8");

  const facultyHeadName = data.facultyHeadName?.trim() || "Faculty Head Name";
  const presidentName = data.presidentName?.trim() || "President Name";

  return template
    .replaceAll("{{LOGO_SRC}}", logoDataUri())
    .replaceAll("{{STUDENT_NAME}}", escapeHtml(data.studentName))
    .replaceAll("{{TREK_NAME}}", escapeHtml(data.trekName))
    .replaceAll("{{DATE}}", escapeHtml(data.date))
    .replaceAll("{{PLACE}}", escapeHtml(data.place))
    .replaceAll("{{FACULTY_HEAD_NAME}}", escapeHtml(facultyHeadName))
    .replaceAll("{{PRESIDENT_NAME}}", escapeHtml(presidentName))
    .replaceAll(
      "{{FACULTY_HEAD_SIGNATURE_BLOCK}}",
      signatureBlock(facultyHeadName, data.facultyHeadSignatureUrl)
    )
    .replaceAll(
      "{{PRESIDENT_SIGNATURE_BLOCK}}",
      signatureBlock(presidentName, data.presidentSignatureUrl)
    );
}

// Serverless hosts (Vercel, Netlify, ...) can't run the full `puppeteer`
// package (its bundled Chromium download is far too large for the function
// size limit), so production launches `puppeteer-core` against the Linux
// Chromium build from `@sparticuz/chromium` instead. That binary only runs
// on a Linux serverless runtime, so local dev keeps using the full
// `puppeteer` package (already has its own bundled Chromium for whatever OS
// you're on). NODE_ENV is used instead of a host-specific flag (like the
// old `VERCEL` check) so this keeps working across hosting migrations.
async function launchBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === "production") {
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([
      import("@sparticuz/chromium"),
      import("puppeteer-core"),
    ]);

    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const { default: puppeteer } = await import("puppeteer");

  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Promise<Browser>;
}

// Renders the certificate template to a PNG buffer via headless Chromium.
// Originally rendered to PDF, but Cloudinary's default account security
// settings block raw PDF/ZIP delivery (401 "deny or ACL failure") unless
// explicitly enabled in the dashboard — PNG delivery has no such
// restriction, so this avoids depending on an account setting outside the
// app. Screenshots at 2x device scale (~192dpi effective) for print-quality
// sharpness at the template's native 1122x793px (A4 landscape @96dpi) size.
export async function generateCertificateImage(data: CertificateData): Promise<Buffer> {
  const html = buildHtml(data);

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1122, height: 793, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load" });

    const sheet = await page.$(".sheet");
    if (!sheet) {
      throw new Error("Certificate template is missing its .sheet element.");
    }

    const png = await sheet.screenshot({ type: "png" });

    return Buffer.from(png);
  } finally {
    await browser.close();
  }
}
