import { google } from "googleapis";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";

// A bare service account has no Drive storage quota of its own for a
// personal/consumer Google account — it can only own files inside a Shared
// Drive (Google Workspace) or a folder a real account has shared with it as
// Editor. GOOGLE_DRIVE_ROOT_FOLDER_ID must point at a folder shared that way
// (see the setup steps this was built alongside) — uploads fail with a
// storage-quota error otherwise, not a permissions error, which is easy to
// mistake for a config problem elsewhere.
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Google Drive isn't configured — GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are missing."
    );
  }

  // Env vars can't hold real newlines, so the key is stored with literal
  // "\n" escapes and unescaped back into actual line breaks here — a raw
  // (still-escaped) PEM key fails JWT signing with an opaque error.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

// One subfolder per trek under the shared root, named after the trek so an
// admin browsing the root folder in Drive itself can find a trek's photos
// without needing this app open. Cached on Trek.driveFolderId after the
// first upload so later uploads skip the create call entirely.
export async function ensureTrekFolder(trekId: string, trekTitle: string): Promise<string> {
  const trek = await prisma.trek.findUnique({
    where: { id: trekId },
    select: { driveFolderId: true },
  });

  if (trek?.driveFolderId) return trek.driveFolderId;

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!rootFolderId) {
    throw new Error("Google Drive isn't configured — GOOGLE_DRIVE_ROOT_FOLDER_ID is missing.");
  }

  const drive = getDriveClient();

  const folder = await drive.files.create({
    requestBody: {
      name: trekTitle,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const folderId = folder.data.id;

  if (!folderId) {
    throw new Error("Google Drive didn't return a folder id.");
  }

  // Race-safe: if two uploads for the same fresh trek land here at once,
  // both create a folder, but only the first update wins — the loser's
  // folder is simply an orphaned duplicate in Drive rather than a crash.
  await prisma.trek.update({
    where: { id: trekId },
    data: { driveFolderId: folderId },
  });

  return folderId;
}

export async function uploadPhotoToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId: string
): Promise<string> {
  const drive = getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = res.data.id;

  if (!fileId) {
    throw new Error("Google Drive didn't return a file id.");
  }

  return fileId;
}

export async function deletePhotoFromDrive(fileId: string) {
  const drive = getDriveClient();

  await drive.files.delete({ fileId, supportsAllDrives: true });
}
