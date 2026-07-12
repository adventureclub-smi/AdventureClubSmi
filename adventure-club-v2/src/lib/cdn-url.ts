const CLOUDINARY_ORIGIN = "https://res.cloudinary.com";

/**
 * Rewrites a Cloudinary URL to go through the CloudFront distribution
 * sitting in front of it, so repeat requests are served from AWS's edge
 * cache instead of hitting Cloudinary's own (metered) bandwidth. Any URL
 * that isn't a Cloudinary URL (local /public paths, empty strings) passes
 * through unchanged.
 */
export function toCdnUrl<T extends string | null | undefined>(url: T): T {
  const cdnHost = process.env.CLOUDINARY_CDN_HOST;

  if (!url || !cdnHost || !url.startsWith(CLOUDINARY_ORIGIN)) {
    return url;
  }

  return url.replace(CLOUDINARY_ORIGIN, `https://${cdnHost}`) as T;
}
