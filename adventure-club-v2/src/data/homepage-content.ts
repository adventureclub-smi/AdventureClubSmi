import type { HomepageContent } from "@/types/homepage";
import { getSocialSettings } from "@/data/social-settings";
import { getStories } from "@/data/stories";
import { getGoogleEarthSettings } from "@/data/google-earth-settings";
import { getHomepageStats } from "@/data/homepage-stats";
import { getActivities } from "@/data/homepage-activities";

/**
 * Single centralized source for all non-database homepage content.
 * Today this is static mock data; once the Admin Panel's "Website CMS"
 * exists, swap the body of this function for a real fetch (API route
 * or Prisma model) — every homepage component already consumes this
 * shape via props, so no component changes will be required.
 *
 * `socials`, `gallery`, `stories`, `googleEarth`, and `stats` already come
 * from the database (admin-editable Instagram/LinkedIn links, homepage
 * gallery photos, homepage stories, the 3D explorer's link/trail stats, and
 * the "By The Numbers" stat cards) — everything else here is still static
 * placeholder content.
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  const [socials, stories, googleEarth, stats, activities] = await Promise.all([
    getSocialSettings(),
    getStories(),
    getGoogleEarthSettings(),
    getHomepageStats(),
    getActivities(),
  ]);

  return { ...homepageContent, socials, stories, googleEarth, stats, activities };
}

const homepageContent: HomepageContent = {
  hero: {
    videoUrl: "/videos/hero-compressed.mp4",
    tagline: "ADVENTURE CLUB",
    titleWords: ["EXPLORE.", "BEYOND.", "LIMITS."],
    leadLine: "Every summit begins with one step.",
    subtitle:
      "Join a community that explores mountains, forests, rivers and unforgettable adventures.",
    buttons: [
      { label: "Join Adventure", href: "/signup", style: "primary" },
      { label: "Explore Treks", href: "/treks", style: "secondary" },
    ],
    showCountdown: true,
  },

  // Always overridden by getHomepageStats() in getHomepageContent() above —
  // kept here only to satisfy the HomepageContent type. Seeded with the
  // original 4 stats plus one extra card directly in the database (see
  // admin Settings > By The Numbers to edit/add/remove them).
  stats: [],

  // Always overridden by getActivities() in getHomepageContent() above —
  // kept here only to satisfy the HomepageContent type. Seeded with the
  // original 7 activities directly in the database (see admin Settings >
  // Things We Do to edit/add/remove them).
  activities: [],

  upcomingTreks: {
    eyebrow: "UPCOMING ADVENTURES",
    heading: "Upcoming Treks.",
    featuredBadgeLabel: "NEXT ADVENTURE",
    showFeaturedCountdown: true,
    featuredTrekId: null,
  },

  // Always overridden by getStories() in getHomepageContent() above — kept
  // here only to satisfy the HomepageContent type. Seeded with the original
  // 3 stories directly in the database (see admin Settings > Stories to
  // add/remove them).
  stories: [],

  finalSection: {
    videoUrl: "/videos/drone-compressed.mp4",
    imageUrl: "/images/about/about-5.JPG",
    heading: ["YOUR NEXT", "ADVENTURE", "STARTS HERE."],
    description:
      "Every summit begins with someone brave enough to take the first step. Make it yours.",
    ctaLabel: "Join Adventure Club",
    ctaHref: "/signup",
  },

  // Always overridden by getSocialSettings() in getHomepageContent() above —
  // kept here only to satisfy the HomepageContent type.
  socials: {},

  // Always overridden by getGoogleEarthSettings() in getHomepageContent()
  // above — kept here only to satisfy the HomepageContent type.
  googleEarth: { earthUrl: "", trailStats: [] },
};
