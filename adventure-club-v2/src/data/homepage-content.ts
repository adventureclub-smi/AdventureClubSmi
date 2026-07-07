import type { HomepageContent } from "@/types/homepage";
import { getSocialSettings } from "@/data/social-settings";
import { getGalleryPhotos } from "@/data/gallery-photos";
import { getStories } from "@/data/stories";

/**
 * Single centralized source for all non-database homepage content.
 * Today this is static mock data; once the Admin Panel's "Website CMS"
 * exists, swap the body of this function for a real fetch (API route
 * or Prisma model) — every homepage component already consumes this
 * shape via props, so no component changes will be required.
 *
 * `socials`, `gallery`, and `stories` already come from the database
 * (admin-editable Instagram/LinkedIn links, homepage gallery photos, and
 * homepage stories) — everything else here is still static placeholder
 * content.
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  const [socials, gallery, stories] = await Promise.all([
    getSocialSettings(),
    getGalleryPhotos(),
    getStories(),
  ]);

  return { ...homepageContent, socials, gallery, stories };
}

const homepageContent: HomepageContent = {
  hero: {
    videoUrl:
      "https://res.cloudinary.com/ix7lwsey/video/upload/q_auto,f_auto,w_1280/v1783360653/AdventureClub/Videos/hero.mp4",
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

  stats: [
    { id: "students", value: 650, suffix: "+", label: "Students" },
    { id: "treks", value: 40, suffix: "+", label: "Treks" },
    { id: "kilometres", value: 1500, suffix: "+", label: "Kilometres" },
    { id: "peaks", value: 20, suffix: "+", label: "Peaks" },
  ],

  activities: [
    {
      id: "trekking",
      icon: "mountain",
      title: "Trekking",
      description:
        "Conquer breathtaking peaks and unforgettable trails with the Adventure Club.",
      backgroundImage: "/images/activities/trekking.jpg",
      highlights: [
        "Sunrise Views",
        "Weekend Adventures",
        "Beginner Friendly",
        "Experienced Leaders",
      ],
      difficulty: "Moderate",
      bestSeason: "Oct – Feb",
      duration: "1–2 Days",
      funFact: "Our highest trek climbs over 2,600m above sea level.",
      buttonText: "Explore Treks",
      buttonLink: "/treks",
      order: 1,
    },
    {
      id: "camping",
      icon: "tent",
      title: "Camping",
      description: "Pitch your tent under open skies and wake up to the wild.",
      backgroundImage: "/images/activities/camping.jpg",
      highlights: [
        "Starlit Nights",
        "Tent Setup Skills",
        "Group Bonding",
        "Off-Grid Escape",
      ],
      difficulty: "Easy",
      bestSeason: "Sep – Mar",
      duration: "1 Night",
      funFact: "Some of our best friendships were made over a shared tent pole.",
      buttonText: "See Upcoming Camps",
      buttonLink: "/treks",
      order: 2,
    },
    {
      id: "bonfire",
      icon: "flame",
      title: "Bonfire",
      description: "Gather around the fire after an unforgettable adventure.",
      backgroundImage: "/images/activities/bonfire.jpg",
      highlights: ["Music", "Stories", "Night Sky", "Camping Experience"],
      funFact: "No trek officially ends until the last log burns out.",
      buttonText: "Join The Circle",
      buttonLink: "/signup",
      order: 3,
    },
    {
      id: "kayaking",
      icon: "sailboat",
      title: "Kayaking",
      description: "Experience calm lakes and exciting waters.",
      backgroundImage: "/images/activities/kayaking.jpg",
      highlights: [
        "Beginner Lessons",
        "Safety Gear Included",
        "Team Paddling",
        "Scenic Routes",
      ],
      difficulty: "Easy – Moderate",
      bestSeason: "Jun – Sep",
      duration: "Half Day",
      buttonText: "Explore Water Adventures",
      buttonLink: "/treks",
      order: 4,
    },
    {
      id: "forest-trails",
      icon: "tree-pine",
      title: "Forest Trails",
      description:
        "Where the road ends, the story begins — lose yourself in the green.",
      backgroundImage: "/images/activities/trail-running.jpg",
      highlights: [
        "Shaded Canopies",
        "Wildlife Spotting",
        "Quiet Trails",
        "Fresh Air Reset",
      ],
      duration: "2–4 Hours",
      buttonText: "Discover Trails",
      buttonLink: "/treks",
      order: 5,
    },
    {
      id: "bouldering",
      icon: "footprints",
      title: "Bouldering",
      description: "Test your grip, your grit, and your nerve on raw rock.",
      backgroundImage: "/images/activities/bouldering.jpg",
      highlights: [
        "No Experience Needed",
        "Certified Instructors",
        "Crash Pads Provided",
        "Real Rock, Real Rush",
      ],
      difficulty: "Beginner to Advanced",
      buttonText: "Try Bouldering",
      buttonLink: "/treks",
      order: 6,
    },
    {
      id: "photography",
      icon: "camera",
      title: "Photography",
      description:
        "Chase the light, frame the wild, and take the mountains home with you.",
      backgroundImage: "/images/activities/photography.jpg",
      highlights: [
        "Golden Hour Shoots",
        "Landscape Tips",
        "Gear Advice Welcome",
        "Shared Reels",
      ],
      funFact: "Half our Instagram feed comes from members, not professionals.",
      buttonText: "See The Shots",
      buttonLink: "#gallery",
      order: 7,
    },
  ],

  upcomingTreks: {
    eyebrow: "UPCOMING ADVENTURES",
    heading: "Upcoming Treks.",
    featuredBadgeLabel: "NEXT ADVENTURE",
    showFeaturedCountdown: true,
    featuredTrekId: null,
  },

  // Always overridden by getGalleryPhotos() in getHomepageContent() above —
  // kept here only to satisfy the HomepageContent type. Seeded with real
  // starter photos directly in the database (see admin Settings > Homepage
  // Gallery to edit/replace them).
  gallery: [],

  // Always overridden by getStories() in getHomepageContent() above — kept
  // here only to satisfy the HomepageContent type. Seeded with the original
  // 3 stories directly in the database (see admin Settings > Stories to
  // add/remove them).
  stories: [],

  finalSection: {
    videoUrl:
      "https://res.cloudinary.com/ix7lwsey/video/upload/q_auto,f_auto,w_1280/v1783360663/AdventureClub/Videos/drone.mp4",
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
};
