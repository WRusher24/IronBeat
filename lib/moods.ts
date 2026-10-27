export interface Mood {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  /** The first query is the mood's "signature" and counts as a genre search. */
  queries: string[];
}

export const MOODS: Mood[] = [
  {
    id: "phonk-hype",
    emoji: "⚡",
    title: "Phonk & Hype",
    blurb: "Drift phonk, cowbells, pure adrenaline",
    queries: ["phonk gym mix", "brazilian phonk", "aggressive drift phonk"],
  },
  {
    id: "focus-nasheed",
    emoji: "🎧",
    title: "Focus & Nasheed",
    blurb: "Clean vocals-only, locked-in focus",
    queries: ["workout nasheed", "nasheed no music vocals only", "motivational nasheed"],
  },
  {
    id: "aggressive-lift",
    emoji: "🔥",
    title: "Aggressive Lift",
    blurb: "Heavy sets, zero mercy",
    queries: ["aggressive gym music", "heavy lifting rap workout", "metal workout mix"],
  },
  {
    id: "cool-down",
    emoji: "🧊",
    title: "Cool Down",
    blurb: "Breathe, stretch, recover",
    queries: ["cool down stretching music", "chill lofi recovery", "ambient relaxing instrumental"],
  },
  {
    id: "heavy-bass",
    emoji: "🔊",
    title: "Heavy Bass",
    blurb: "Sub-bass that shakes the rack",
    queries: ["bass boosted gym", "trap bass workout", "dubstep workout"],
  },
  {
    id: "beast-mode",
    emoji: "🦍",
    title: "Beast Mode",
    blurb: "PR attempts and max effort",
    queries: ["beast mode workout music", "gym motivation rap", "hardstyle workout"],
  },
  {
    id: "cardio-flow",
    emoji: "🏃",
    title: "Cardio Flow",
    blurb: "Steady BPM for the long run",
    queries: ["cardio running mix 160 bpm", "edm running workout", "house cardio mix"],
  },
  {
    id: "synthwave-energy",
    emoji: "🌆",
    title: "Synthwave Energy",
    blurb: "Neon drive, retro power",
    queries: ["synthwave workout", "cyberpunk synthwave energy", "retrowave driving mix"],
  },
  {
    id: "motivation-speeches",
    emoji: "🎤",
    title: "Gym Speeches",
    blurb: "Words that move the weight",
    queries: ["gym motivational speech", "david goggins motivation", "discipline motivation speech"],
  },
  {
    id: "hip-hop-grind",
    emoji: "🎤",
    title: "Hip-Hop Grind",
    blurb: "Bars for the grind",
    queries: ["hip hop gym playlist", "drill workout", "old school hip hop workout"],
  },
];

export const moodById = (id: string) => MOODS.find((m) => m.id === id);
