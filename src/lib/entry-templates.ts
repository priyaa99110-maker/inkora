export type EntryTemplate = {
  key: string;
  label: string;
  emoji: string;
  title: string;
  /** Prefill body as HTML. Purely a starting point — nothing is enforced. */
  html: string;
};

const list = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const heading = (text: string) => `<h2>${text}</h2>`;
const para = (text = "") => `<p>${text}</p>`;

export const ENTRY_TEMPLATES: EntryTemplate[] = [
  {
    key: "daily",
    label: "Daily journal",
    emoji: "🌸",
    title: "Today",
    html: heading("How today felt") + para() + heading("What happened") + para() + heading("One small win") + para(),
  },
  {
    key: "gratitude",
    label: "Gratitude",
    emoji: "🙏",
    title: "Grateful for",
    html: heading("Three things I'm grateful for") + list(["", "", ""]) + heading("Why they mattered") + para(),
  },
  {
    key: "reflection",
    label: "Reflection",
    emoji: "🪞",
    title: "A reflection",
    html: heading("What I noticed about myself") + para() + heading("What I'd do differently") + para(),
  },
  {
    key: "morning-pages",
    label: "Morning pages",
    emoji: "🌅",
    title: "Morning pages",
    html: para("Whatever is on my mind, unfiltered…") + para() + para(),
  },
  {
    key: "dream",
    label: "Dream log",
    emoji: "🌙",
    title: "Last night's dream",
    html: heading("What I remember") + para() + heading("How it felt") + para() + heading("Anything it echoes") + para(),
  },
  {
    key: "travel",
    label: "Travel",
    emoji: "🧳",
    title: "Travel notes",
    html: heading("Where I am") + para() + heading("What I saw") + para() + heading("Moments to remember") + list(["", ""]),
  },
  {
    key: "mood",
    label: "Mood check-in",
    emoji: "💗",
    title: "Mood check-in",
    html: heading("How I feel right now") + para() + heading("What's driving it") + para() + heading("What would help") + para(),
  },
  {
    key: "goals",
    label: "Goals",
    emoji: "🎯",
    title: "Goals",
    html: heading("What I'm working toward") + list(["", ""]) + heading("Next step") + para(),
  },
  {
    key: "weekly-review",
    label: "Weekly review",
    emoji: "📅",
    title: "This week",
    html: heading("Highlights") + list(["", ""]) + heading("Challenges") + list(["", ""]) + heading("Next week") + para(),
  },
  {
    key: "monthly-review",
    label: "Monthly review",
    emoji: "🗓️",
    title: "This month",
    html:
      heading("What changed") + para() + heading("What I'm proud of") + list(["", ""]) + heading("What I'm carrying forward") + para(),
  },
  {
    key: "productivity",
    label: "Productivity",
    emoji: "⚡",
    title: "Focus log",
    html: heading("Top priorities") + list(["", "", ""]) + heading("Distractions") + para() + heading("Done") + para(),
  },
  {
    key: "meeting",
    label: "Meeting notes",
    emoji: "📝",
    title: "Meeting notes",
    html: heading("Context") + para() + heading("Notes") + list(["", ""]) + heading("Action items") + list(["", ""]),
  },
  {
    key: "letter",
    label: "Letter to myself",
    emoji: "💌",
    title: "Dear me",
    html: para("Dear me,") + para() + para("With love,") + para(),
  },
  {
    key: "free",
    label: "Free writing",
    emoji: "🕊️",
    title: "Untitled",
    html: para(),
  },
];

export function findTemplate(key: string | null | undefined) {
  return ENTRY_TEMPLATES.find((t) => t.key === key) ?? null;
}