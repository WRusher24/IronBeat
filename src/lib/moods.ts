export interface Mood {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  /** One is picked at random on each launch so the deck stays fresh. */
  queries: string[];
}

export const MOODS: Mood[] = [
  { id: "phonk-hype", emoji: "⚡", title: "Phonk & Hype", tagline: "Drift-ready bass and cowbells", queries: ["brazilian phonk", "phonk gym", "drift phonk", "aggressive phonk"] },
  { id: "focus-nasheed", emoji: "🎧", title: "Focus & Nasheed", tagline: "Locked in, vocals only", queries: ["workout nasheed", "nasheed motivation", "nasheed no music", "vocals only nasheed"] },
  { id: "aggressive-lift", emoji: "🔥", title: "Aggressive Lift", tagline: "Heavy sets, zero mercy", queries: ["aggressive workout music", "heavy lifting metal", "hard trap workout", "rage gym"] },
  { id: "cool-down", emoji: "🧊", title: "Cool Down", tagline: "Breathe, stretch, recover", queries: ["cool down stretching music", "chill lofi recovery", "ambient relax", "calm instrumental"] },
  { id: "heavy-bass", emoji: "🔊", title: "Heavy Bass", tagline: "Sub-bass that shakes the rack", queries: ["bass boosted", "heavy bass trap", "dubstep workout", "808 bass"] },
  { id: "beast-mode", emoji: "🦁", title: "Beast Mode", tagline: "Max effort anthems", queries: ["beast mode workout", "gym motivational speech", "hip hop workout", "gym motivation"] },
  { id: "cardio-flow", emoji: "🏃", title: "Cardio Flow", tagline: "Steady tempo, endless miles", queries: ["running music 160 bpm", "cardio edm", "hiit workout music", "upbeat dance workout"] },
  { id: "synthwave-energy", emoji: "🌆", title: "Synthwave Energy", tagline: "Neon night-run momentum", queries: ["synthwave workout", "retrowave driving", "outrun synthwave", "darksynth"] },
];

export function pickQuery(mood: Mood): string {
  return mood.queries[Math.floor(Math.random() * mood.queries.length)];
}
