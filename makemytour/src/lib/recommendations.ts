// ✅ Personalized Recommendations — Task 6
//
// Hybrid recommendation engine:
//  1. Content-based filtering: builds a destination affinity profile from the
//     user's own viewed/booked history (localStorage-tracked interactions).
//  2. Collaborative-filtering-style signal: a curated "travelers who liked X
//     also explored Y" co-occurrence map, used to surface related destinations
//     the user hasn't directly interacted with yet.
//  3. Feedback loop: "helpful" / "irrelevant" feedback on a recommendation
//     nudges that destination's score up or down for future recommendations.

const INTERACTIONS_KEY = "mmt_interactions";
const FEEDBACK_KEY = "mmt_rec_feedback";
const MAX_INTERACTIONS = 200;

export type InteractionType = "viewed" | "booked" | "reviewed";
export type EntityType = "flight" | "hotel";

export interface Interaction {
  type: InteractionType;
  entityType: EntityType;
  destination: string; // normalized city/location name
  timestamp: number;
}

interface FeedbackMap {
  [destinationKey: string]: {
    helpful: number;
    irrelevant: number;
  };
}

// Simulates a collaborative-filtering "users who liked X also liked Y" table.
// In a production system this would be learned from aggregate booking data
// across all users; here it's a curated seed so recommendations feel sensible
// even for a brand-new user base.
const RELATED_DESTINATIONS: Record<string, string[]> = {
  goa: ["bali", "maldives", "phuket", "andaman"],
  bali: ["goa", "phuket", "maldives"],
  maldives: ["bali", "goa", "seychelles"],
  manali: ["shimla", "leh", "dharamshala"],
  shimla: ["manali", "dharamshala", "nainital"],
  leh: ["manali", "spiti"],
  paris: ["rome", "amsterdam", "london"],
  rome: ["paris", "florence", "venice"],
  london: ["paris", "amsterdam", "edinburgh"],
  dubai: ["abu dhabi", "doha", "singapore"],
  singapore: ["bangkok", "kuala lumpur", "dubai"],
  bangkok: ["singapore", "phuket", "kuala lumpur"],
  mumbai: ["goa", "pune", "udaipur"],
  delhi: ["agra", "jaipur", "manali"],
  jaipur: ["udaipur", "delhi", "jodhpur"],
  udaipur: ["jaipur", "jodhpur", "mumbai"],
};

const normalize = (value: string): string =>
  (value || "").trim().toLowerCase().split(",")[0].trim();

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const recordInteraction = (
  type: InteractionType,
  entityType: EntityType,
  rawDestination: string
): void => {
  if (typeof window === "undefined" || !rawDestination) return;
  const destination = normalize(rawDestination);
  if (!destination) return;

  try {
    const interactions = safeParse<Interaction[]>(
      window.localStorage.getItem(INTERACTIONS_KEY),
      []
    );
    interactions.push({
      type,
      entityType,
      destination,
      timestamp: Date.now(),
    });
    // Cap the log so it doesn't grow unbounded
    const trimmed = interactions.slice(-MAX_INTERACTIONS);
    window.localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // non-critical, ignore storage errors
  }
};

const loadInteractions = (): Interaction[] => {
  if (typeof window === "undefined") return [];
  return safeParse<Interaction[]>(
    window.localStorage.getItem(INTERACTIONS_KEY),
    []
  );
};

const loadFeedback = (): FeedbackMap => {
  if (typeof window === "undefined") return {};
  return safeParse<FeedbackMap>(window.localStorage.getItem(FEEDBACK_KEY), {});
};

export const recordFeedback = (
  destination: string,
  helpful: boolean
): void => {
  if (typeof window === "undefined") return;
  const key = normalize(destination);
  if (!key) return;
  try {
    const feedback = loadFeedback();
    const entry = feedback[key] || { helpful: 0, irrelevant: 0 };
    if (helpful) entry.helpful += 1;
    else entry.irrelevant += 1;
    feedback[key] = entry;
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
  } catch {
    // ignore
  }
};

const WEIGHTS: Record<InteractionType, number> = {
  viewed: 1,
  booked: 3,
  reviewed: 2,
};

interface AffinityEntry {
  destination: string;
  score: number;
}

// Builds a destination -> score profile from interaction history, adjusted
// by any explicit helpful/irrelevant feedback the user has already given.
const buildAffinityProfile = (): AffinityEntry[] => {
  const interactions = loadInteractions();
  const feedback = loadFeedback();
  const scores: Record<string, number> = {};

  const now = Date.now();
  interactions.forEach((interaction) => {
    // Mild recency decay: interactions older than 30 days count for less
    const ageDays = (now - interaction.timestamp) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0.4, 1 - ageDays / 60);
    const base = WEIGHTS[interaction.type] ?? 1;
    scores[interaction.destination] =
      (scores[interaction.destination] || 0) + base * recencyFactor;
  });

  Object.entries(feedback).forEach(([destination, counts]) => {
    if (!(destination in scores)) scores[destination] = 0;
    scores[destination] += counts.helpful * 2.5;
    scores[destination] -= counts.irrelevant * 4; // strongly suppress disliked picks
  });

  return Object.entries(scores)
    .map(([destination, score]) => ({ destination, score }))
    .filter((entry) => entry.score > -100) // keep only, filtering handled by caller
    .sort((a, b) => b.score - a.score);
};

export interface RecommendationItem {
  id: string;
  entityType: EntityType;
  title: string;
  subtitle: string;
  price: number;
  destination: string;
  reason: string;
  data: any; // original hotel/flight record for navigation
}

interface RawHotel {
  id: string;
  hotelName: string;
  location: string;
  pricePerNight: number;
}

interface RawFlight {
  id: string;
  flightName: string;
  from: string;
  to: string;
  price: number;
}

export const getRecommendations = (
  hotels: RawHotel[],
  flights: RawFlight[],
  limit = 6
): RecommendationItem[] => {
  const feedback = loadFeedback();
  const affinity = buildAffinityProfile().filter(
    (entry) => (feedback[entry.destination]?.irrelevant || 0) < 3 // fully mute repeatedly-rejected picks
  );

  const recommendations: RecommendationItem[] = [];
  const usedIds = new Set<string>();

  const pushHotelsFor = (destination: string, reason: string) => {
    hotels
      .filter((h) => normalize(h.location) === destination)
      .forEach((h) => {
        if (usedIds.has(`hotel-${h.id}`)) return;
        usedIds.add(`hotel-${h.id}`);
        recommendations.push({
          id: h.id,
          entityType: "hotel",
          title: h.hotelName,
          subtitle: h.location,
          price: h.pricePerNight,
          destination,
          reason,
          data: h,
        });
      });
  };

  const pushFlightsFor = (destination: string, reason: string) => {
    flights
      .filter((f) => normalize(f.to) === destination)
      .forEach((f) => {
        if (usedIds.has(`flight-${f.id}`)) return;
        usedIds.add(`flight-${f.id}`);
        recommendations.push({
          id: f.id,
          entityType: "flight",
          title: f.flightName,
          subtitle: `${f.from} → ${f.to}`,
          price: f.price,
          destination,
          reason,
          data: f,
        });
      });
  };

  // 1. Content-based: recommend more of what the user already likes
  affinity.slice(0, 3).forEach(({ destination }) => {
    const label = destination.charAt(0).toUpperCase() + destination.slice(1);
    pushHotelsFor(destination, `You've shown interest in ${label} — here's more from there.`);
    pushFlightsFor(destination, `You've shown interest in ${label} — here's a flight there.`);
  });

  // 2. Collaborative-style: related destinations to top affinities
  affinity.slice(0, 2).forEach(({ destination }) => {
    const related = RELATED_DESTINATIONS[destination] || [];
    const likedLabel = destination.charAt(0).toUpperCase() + destination.slice(1);
    related.forEach((rel) => {
      if ((feedback[rel]?.irrelevant || 0) >= 3) return;
      const relLabel = rel.charAt(0).toUpperCase() + rel.slice(1);
      pushHotelsFor(rel, `You liked ${likedLabel}! Travelers who liked it also explored ${relLabel}.`);
      pushFlightsFor(rel, `You liked ${likedLabel}! Travelers who liked it also explored ${relLabel}.`);
    });
  });

  // 3. Cold-start / fallback: popular picks for new users or to fill quota
  if (recommendations.length < limit) {
    hotels.forEach((h) => {
      if (recommendations.length >= limit) return;
      if (usedIds.has(`hotel-${h.id}`)) return;
      if ((feedback[normalize(h.location)]?.irrelevant || 0) >= 3) return;
      usedIds.add(`hotel-${h.id}`);
      recommendations.push({
        id: h.id,
        entityType: "hotel",
        title: h.hotelName,
        subtitle: h.location,
        price: h.pricePerNight,
        destination: normalize(h.location),
        reason: "Popular with travelers like you.",
        data: h,
      });
    });
    flights.forEach((f) => {
      if (recommendations.length >= limit) return;
      if (usedIds.has(`flight-${f.id}`)) return;
      if ((feedback[normalize(f.to)]?.irrelevant || 0) >= 3) return;
      usedIds.add(`flight-${f.id}`);
      recommendations.push({
        id: f.id,
        entityType: "flight",
        title: f.flightName,
        subtitle: `${f.from} → ${f.to}`,
        price: f.price,
        destination: normalize(f.to),
        reason: "Popular with travelers like you.",
        data: f,
      });
    });
  }

  return recommendations.slice(0, limit);
};
