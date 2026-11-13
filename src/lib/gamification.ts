import { format, subDays } from "date-fns";

export type Badge = {
  key: string;
  label: string;
  emoji: string;
  description: string;
  /** Feature this badge unlocks, if any. */
  unlocks?: string;
  earned: boolean;
  progress: number; // 0..1
};

export type GameStats = {
  entries: number;
  streak: number;
  longestStreak: number;
  words: number;
  referrals: number;
  xp: number;
  level: number;
  levelLabel: string;
  intoLevel: number;
  levelSpan: number;
  nextLevelXp: number;
};

export const LEVELS = [
  { min: 0, label: "Seedling" },
  { min: 100, label: "Sprout" },
  { min: 300, label: "Blossom" },
  { min: 700, label: "Butterfly" },
  { min: 1300, label: "Moonwriter" },
  { min: 2200, label: "Storyweaver" },
  { min: 3500, label: "Luminary" },
];

/** XP is earned from writing, streaks and invited friends. */
export function computeXp(input: { entries: number; words: number; streak: number; referrals: number }) {
  return (
    input.entries * 10 +
    Math.floor(input.words / 100) * 5 +
    input.streak * 15 +
    input.referrals * 100
  );
}

export function levelFor(xp: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  return {
    level: index + 1,
    levelLabel: current.label,
    intoLevel: xp - current.min,
    levelSpan: next ? next.min - current.min : Math.max(1, xp - current.min),
    nextLevelXp: next ? next.min : xp,
  };
}

export function streaks(dates: string[]) {
  const days = new Set(dates);
  let cursor = new Date();
  if (!days.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1);
  let streak = 0;
  while (days.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  const sorted = Array.from(days).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && format(subDays(new Date(d + "T00:00:00"), 1), "yyyy-MM-dd") === prev) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { streak, longestStreak: longest };
}

export function buildStats(input: {
  entryDates: string[];
  words: number;
  referrals: number;
  bonusXp: number;
}): GameStats {
  const { streak, longestStreak } = streaks(input.entryDates);
  const entries = input.entryDates.length;
  const xp = computeXp({ entries, words: input.words, streak, referrals: input.referrals }) + input.bonusXp;
  return { entries, streak, longestStreak, words: input.words, referrals: input.referrals, xp, ...levelFor(xp) };
}

const pct = (value: number, target: number) => Math.max(0, Math.min(1, value / target));

export function buildBadges(s: GameStats): Badge[] {
  return [
    {
      key: "first-page",
      label: "First page",
      emoji: "🌱",
      description: "Write your first journal entry.",
      earned: s.entries >= 1,
      progress: pct(s.entries, 1),
    },
    {
      key: "week-streak",
      label: "Seven days",
      emoji: "🔥",
      description: "Journal 7 days in a row.",
      unlocks: "Premium entry templates",
      earned: s.longestStreak >= 7,
      progress: pct(s.longestStreak, 7),
    },
    {
      key: "wordsmith",
      label: "Wordsmith",
      emoji: "✒️",
      description: "Write 5,000 words in total.",
      unlocks: "AI writing assistant boosts",
      earned: s.words >= 5000,
      progress: pct(s.words, 5000),
    },
    {
      key: "collector",
      label: "Collector",
      emoji: "📚",
      description: "Keep 25 entries in your journal.",
      earned: s.entries >= 25,
      progress: pct(s.entries, 25),
    },
    {
      key: "friend",
      label: "Kindred spirit",
      emoji: "💌",
      description: "Invite a friend with your referral code.",
      unlocks: "Photo attachments on entries",
      earned: s.referrals >= 1,
      progress: pct(s.referrals, 1),
    },
    {
      key: "circle",
      label: "Little circle",
      emoji: "🫶",
      description: "Invite 3 friends.",
      unlocks: "Extra themes & colour pickers",
      earned: s.referrals >= 3,
      progress: pct(s.referrals, 3),
    },
    {
      key: "moonwriter",
      label: "Moonwriter",
      emoji: "🌙",
      description: "Reach 1,300 XP.",
      earned: s.xp >= 1300,
      progress: pct(s.xp, 1300),
    },
    {
      key: "month-streak",
      label: "Full moon cycle",
      emoji: "🏆",
      description: "Journal 30 days in a row.",
      unlocks: "Golden journal badge",
      earned: s.longestStreak >= 30,
      progress: pct(s.longestStreak, 30),
    },
  ];
}
