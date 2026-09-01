export const RECRUITMENT_TEAMS = [
  "Web & Tech",
  "Visual Media",
  "Marketing",
  "Finance",
  "Logistics",
  "Events",
  "Guide",
] as const;

export type RecruitmentTeam = (typeof RECRUITMENT_TEAMS)[number];

export const MAX_TEAM_PREFERENCES = 3;

// These two teams need to see prior work before an interview even happens —
// every other team can judge that at interview stage instead.
export const PORTFOLIO_REQUIRED_TEAMS: RecruitmentTeam[] = ["Visual Media", "Marketing"];

export const PREFERENCE_LABELS = ["1st Preference", "2nd Preference", "3rd Preference"];

export const RECRUITMENT_TEAM_DESCRIPTIONS: Record<RecruitmentTeam, string> = {
  "Web & Tech": `We are the digital backbone of Navira, making sure our online home runs smoothly 24/7. Our primary job is website maintenance, ensuring everything from sign-ups and user registrations to secure payment gateways works flawlessly so our community has a seamless experience.

You don't need to be a senior engineer to join us, but a basic knowledge of HTML and Python is essential for troubleshooting, making quick frontend tweaks, and managing backend logic. We work behind the scenes to make sure the platform is stable, secure, and ready for every new trek or workshop launch.`,

  "Visual Media": `We are the keepers of Navira's memories. Our main job is to make sure no moment gets missed and every memory is safely captured. You will always find us right in the middle of the action during trips, constantly moving around to catch those real, raw emotions and unforgettable highlights.

We love clean composition, smart framing, and beautiful lighting, but we care just as much about who we are as a brand. While we always stay true to Navira's identity, we also celebrate your personal artistic style. We want you to bring your own unique lens to the team to help us tell our story.`,

  Marketing: `We are the creative engine behind Navira's online presence, dedicated to keeping the exact vibe and brand identity you see on our page alive and humming. Our days are fast-paced and highly collaborative; we work hand-in-hand with our photographers to transform their raw captures into seamless social media magic.

Our main job is to keep our community informed, hyped, and prepared through constant updates. You will be responsible for keeping our social media active and designing a steady stream of posters for upcoming treks, workshops, announcements, etc. To pull this off, a basic understanding of Adobe Illustrator is essential for quick layout tweaks, graphics, and text overlays.`,

  Finance: `We are the financial stewards of Navira, keeping the club's engine running smoothly behind the scenes. Our mission is to match the big, ambitious goals of Navira with rock-solid fiscal discipline, ensuring we expand our events safely without ever being financially reckless.

We keep total visibility over every rupee by meticulously tracking all money that flows in and out of the club. If you are highly organized, detail-oriented, and believe that strategic budgeting is what makes massive adventures possible, you will fit right in.`,

  Logistics: `We are the ultimate minds of Navira, working quietly behind the scenes to turn big blueprints into real-world action. Our job is simple but critical: we take care of every single logistical detail that goes into making our treks and events possible. Because smooth execution requires total alignment, we work hand-in-hand with both the Events and Finance teams to bridge the gap between a great idea and a flawless event.

We are the gatekeepers of organization. From the moment someone signs up to the day they step onto the trail, we make sure everything is strictly in check, keeping our operational systems perfectly balanced.`,

  Events: `We are the masterminds behind every single experience that defines Navira. From intense, skill-building workshops to our craziest, most ambitious treks, our team is solely responsible for making it all happen. We don't just plan events, we bring the wild, legendary ideas to life that give Navira its true identity.

We take total ownership of the entire event blueprint. We decide when an event happens, map out exactly how it will unfold, and manage every single detail from the initial spark of an idea to the final cleanup. If you love master planning, and want to be the one pulling the strings behind our biggest moments, this is your team.`,

  Guide: `We are the ones on the trail with the group, not behind a screen. Our job starts the moment everyone's boots hit the dirt — reading the terrain, setting the pace, and keeping every single person accounted for from the first step to the last.

Being a guide means staying calm when plans change, knowing the route well enough to trust your gut, and looking out for people who don't yet know what they're capable of. If you're comfortable leading in the outdoors and taking responsibility for a group's safety and experience, this is your team.`,
};
