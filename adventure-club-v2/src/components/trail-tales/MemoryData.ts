export type Memory = {
  id: string;
  emoji: string;
  title: string;
  tripType: string;
  date: string;
  location: string;
  story: string;
  quotes: string[];
  people: string[];
  photos: string[];
};

// ===== EDIT ME: add/remove memories here — the UI is fully generated from
// this array, nothing else needs to change. `photos` accepts any image URL
// (local /public path or a remote one); leave it empty for a text-only card.
export const memories: Memory[] = [
  {
    id: "cold-cup-noodles",
    emoji: "🍜",
    title: "Cold Cup Noodles",
    tripType: "Camping",
    date: "Feb 2025",
    location: "Savandurga",
    story:
      "The stove ran out of gas an hour before dinner. Nobody wanted to hike back down for more, so we ate the noodles cold, huddled around a dying fire, convinced it was somehow the best meal any of us had ever had.",
    quotes: [
      "“Cold cup noodles, warm memories.”",
      "“Never again. Also, same time next year?”",
    ],
    people: ["Aarav", "Meera", "Kabir", "Zoya"],
    photos: ["/images/stories/campfire.png"],
  },
  {
    id: "we-left-as-strangers",
    emoji: "🚌",
    title: "We Left As Strangers",
    tripType: "Trek",
    date: "Jan 2025",
    location: "Skandagiri",
    story:
      "Twelve of us boarded a bus before sunrise, most having never spoken a word to each other. By the time we reached the summit, we weren't classmates anymore — we were a team that had carried each other's backpacks up the last, steepest stretch.",
    quotes: ["“Wait, you're in my batch? Since when?!”"],
    people: ["Ishaan", "Priya", "Rohan", "Ananya", "and 8 others"],
    photos: [],
  },
  {
    id: "still-couldnt-climb-the-tree",
    emoji: "🌲",
    title: "Still Couldn't Climb The Tree",
    tripType: "Trek",
    date: "Mar 2025",
    location: "Nandi Hills",
    story:
      "We reached the summit before sunrise, exhausted and proud. Then someone pointed at the massive old tree at the trailhead and said 'ten bucks says none of you can climb that.' Three hours of hiking, and we still lost that bet.",
    quotes: ["“We conquered the mountain but not the tree.”"],
    people: ["Devansh", "Riya"],
    photos: ["/images/stories/tree.png"],
  },
  {
    id: "the-slide-down",
    emoji: "🏞️",
    title: "The Slide Down",
    tripType: "Trek",
    date: "May 2025",
    location: "Savandurga",
    story:
      "What was supposed to be a careful, controlled descent turned into an unplanned rock slide the second someone's foot slipped on the moss. Nobody got hurt. Everybody got a story, and one very ruined pair of trekking pants.",
    quotes: ["“WEEE!”", "“I regret nothing.”"],
    people: ["Tanya", "Arjun", "Simran"],
    photos: ["/images/stories/slide.png"],
  },
];
