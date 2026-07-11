export type CTAButton = {
  label: string;
  href: string;
  style: "primary" | "secondary";
};

export interface HeroContent {
  videoUrl: string;
  tagline: string;
  titleWords: string[];
  leadLine: string;
  subtitle: string;
  buttons: CTAButton[];
  showCountdown: boolean;
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export interface ActivityCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  backgroundImage: string;
  highlights: string[];
  difficulty?: string;
  bestSeason?: string;
  duration?: string;
  funFact?: string;
  buttonText: string;
  buttonLink: string;
  order: number;
}

export interface UpcomingTreksConfig {
  eyebrow: string;
  heading: string;
  featuredBadgeLabel: string;
  showFeaturedCountdown: boolean;
  featuredTrekId?: string | null;
}

export type MediaType = "image" | "video";

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface StoryMedia {
  type: MediaType;
  src: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  media: StoryMedia[];
  order: number;
  published: boolean;
}

export interface StoryScene {
  id: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  caption: string;
  order: number;
}

export interface FinalSectionContent {
  videoUrl?: string | null;
  imageUrl: string;
  heading: string[];
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
}

export interface TrailStat {
  id: string;
  label: string;
  value: string;
  tooltip: string;
  order: number;
}

export interface GoogleEarthContent {
  earthUrl: string;
  trailStats: TrailStat[];
}

export interface HomepageContent {
  hero: HeroContent;
  stats: StatItem[];
  activities: ActivityCard[];
  upcomingTreks: UpcomingTreksConfig;
  gallery: GalleryPhoto[];
  stories: Story[];
  finalSection: FinalSectionContent;
  socials: SocialLinks;
  googleEarth: GoogleEarthContent;
}

export interface TrekSummary {
  id: string;
  title: string;
  destination: string;
  difficulty: string;
  date: string;
  price: number;
  coverImage: string;
  seatsLeft: number;
  registrationOpensAt: string | null;
}

export interface TrekMapPin {
  id: string;
  title: string;
  destination: string;
  difficulty: string;
  date: string;
  coverImage: string;
  description: string;
  isHistorical: boolean;
  latitude: number;
  longitude: number;
}

export interface TrekWaypoint {
  id: string;
  label: string;
  description: string;
  latitude: number;
  longitude: number;
  mediaUrl: string;
  mediaType: "image" | "video";
  order: number;
}

export interface UpcomingTrekRoute {
  trekId: string;
  title: string;
  destination: string;
  date: string;
  waypoints: TrekWaypoint[];
}
