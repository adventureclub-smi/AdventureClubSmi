/**
 * Injects a Cloudinary delivery transformation into an upload URL so the
 * CDN serves a lighter version instead of the original file — this is what
 * actually burns bandwidth credits on the free plan, so shrinking delivered
 * bytes directly cuts cost per view/play. Cloudinary generates the
 * transformed asset once on first request and caches it after that.
 */
function withTransform<T extends string | null | undefined>(url: T, transform: string): T {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`) as T;
}

// q_auto lets Cloudinary pick the best quality/size tradeoff per image;
// f_auto serves a more efficient format (WebP/AVIF) to browsers that
// support it. ~4x smaller in practice with no visible quality loss.
export function optimizeImage<T extends string | null | undefined>(url: T): T {
  return withTransform(url, "q_auto,f_auto");
}

// These are music tracks people listen to for a while, not sound effects —
// 96kbps keeps them sounding fine while meaningfully cutting the bitrate
// (most were uploaded around ~128kbps).
export function optimizeAudio<T extends string | null | undefined>(url: T): T {
  return withTransform(url, "br_96k");
}

// For actual video clips (trek waypoint media) — q_auto behaves well for
// video (unlike audio, where it can backfire), picking a sensible
// quality/bitrate automatically.
export function optimizeVideo<T extends string | null | undefined>(url: T): T {
  return withTransform(url, "q_auto");
}
