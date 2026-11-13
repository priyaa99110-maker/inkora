export type ThemeKey =
  // Current palette set
  | "light"
  | "dark"
  | "midnight"
  | "forest"
  | "lavender"
  | "ocean"
  | "sunset"
  | "sakura-pink"
  | "beige-paper"
  | "minimal-white"
  // Legacy keys (kept so existing profiles keep working)
  | "butterfly-dream"
  | "cloud-garden"
  | "sakura-night"
  | "moonlight"
  | "ocean-breeze"
  | "sunset-glow"
  | "forest-calm"
  | "lavender-mist"
  | "peach-cream"
  | "midnight-rose";

export type FontKey = "sans" | "serif" | "rounded" | "mono";
export type ScaleKey = "sm" | "md" | "lg" | "xl";
export type SpacingKey = "tight" | "normal" | "relaxed" | "loose";

/** Themes that always render on a dark canvas. */
export const DARK_THEMES: ThemeKey[] = ["dark", "midnight"];

export const THEMES: { key: ThemeKey; label: string; emoji: string; swatch: [string, string] }[] = [
  { key: "light", label: "Light", emoji: "☀️", swatch: ["oklch(0.9 0.03 260)", "oklch(0.98 0.01 260)"] },
  { key: "dark", label: "Dark", emoji: "🌑", swatch: ["oklch(0.3 0.02 260)", "oklch(0.18 0.02 260)"] },
  { key: "midnight", label: "Midnight", emoji: "🌌", swatch: ["oklch(0.35 0.09 265)", "oklch(0.16 0.05 265)"] },
  { key: "forest", label: "Forest", emoji: "🌿", swatch: ["oklch(0.62 0.13 145)", "oklch(0.87 0.07 130)"] },
  { key: "lavender", label: "Lavender", emoji: "💜", swatch: ["oklch(0.68 0.14 295)", "oklch(0.88 0.08 280)"] },
  { key: "ocean", label: "Ocean", emoji: "🌊", swatch: ["oklch(0.66 0.15 225)", "oklch(0.88 0.08 205)"] },
  { key: "sunset", label: "Sunset", emoji: "🌅", swatch: ["oklch(0.7 0.17 45)", "oklch(0.87 0.1 25)"] },
  { key: "sakura-pink", label: "Sakura Pink", emoji: "🌸", swatch: ["oklch(0.72 0.16 350)", "oklch(0.9 0.08 330)"] },
  { key: "beige-paper", label: "Beige Paper", emoji: "📜", swatch: ["oklch(0.68 0.07 75)", "oklch(0.93 0.04 85)"] },
  { key: "minimal-white", label: "Minimal White", emoji: "⬜", swatch: ["oklch(0.55 0.01 260)", "oklch(1 0 0)"] },
];

export const ACCENT_PRESETS: { label: string; value: string }[] = [
  { label: "Theme default", value: "" },
  { label: "Rose", value: "#e75480" },
  { label: "Coral", value: "#ff7a59" },
  { label: "Amber", value: "#f0a202" },
  { label: "Mint", value: "#2fbf9b" },
  { label: "Teal", value: "#12a4a4" },
  { label: "Sky", value: "#3b9ae1" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Violet", value: "#a855f7" },
  { label: "Plum", value: "#b3529e" },
];

export const FONTS: { key: FontKey; label: string; css: string }[] = [
  { key: "sans", label: "Inter (clean)", css: '"Inter", sans-serif' },
  { key: "serif", label: "Playfair (classic)", css: '"Playfair Display", serif' },
  { key: "rounded", label: "Poppins (soft)", css: '"Poppins", sans-serif' },
  { key: "mono", label: "Mono (focused)", css: "ui-monospace, monospace" },
];

export const SCALES: { key: ScaleKey; label: string; value: number }[] = [
  { key: "sm", label: "Small", value: 0.92 },
  { key: "md", label: "Default", value: 1 },
  { key: "lg", label: "Large", value: 1.08 },
  { key: "xl", label: "Extra large", value: 1.18 },
];

export const LETTER_SPACINGS: { key: SpacingKey; label: string; value: string }[] = [
  { key: "tight", label: "Tight", value: "-0.015em" },
  { key: "normal", label: "Normal", value: "0em" },
  { key: "relaxed", label: "Relaxed", value: "0.02em" },
  { key: "loose", label: "Loose", value: "0.05em" },
];

export const LINE_SPACINGS: { key: SpacingKey; label: string; value: string }[] = [
  { key: "tight", label: "Tight", value: "1.45" },
  { key: "normal", label: "Normal", value: "1.8" },
  { key: "relaxed", label: "Relaxed", value: "2" },
  { key: "loose", label: "Loose", value: "2.3" },
];

export type CustomColors = {
  primary: string;
  secondary: string;
  button: string;
  link: string;
  card: string;
};

export const EMPTY_COLORS: CustomColors = { primary: "", secondary: "", button: "", link: "", card: "" };

export const COLOR_SLOTS: { key: keyof CustomColors; label: string; hint: string; fallback: string }[] = [
  { key: "primary", label: "Primary", hint: "Headings, highlights", fallback: "#c86bd0" },
  { key: "secondary", label: "Secondary", hint: "Chips and soft fills", fallback: "#e9d5ff" },
  { key: "button", label: "Buttons", hint: "Primary buttons", fallback: "#c86bd0" },
  { key: "link", label: "Links", hint: "Inline links", fallback: "#6366f1" },
  { key: "card", label: "Cards", hint: "Card surfaces", fallback: "#ffffff" },
];

export type Appearance = {
  theme: ThemeKey;
  accent: string;
  dark: boolean;
  font: FontKey;
  scale: ScaleKey;
  letterSpacing: SpacingKey;
  lineSpacing: SpacingKey;
  colors: CustomColors;
};

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "light",
  accent: "",
  dark: false,
  font: "sans",
  scale: "md",
  letterSpacing: "normal",
  lineSpacing: "normal",
  colors: EMPTY_COLORS,
};

const STORAGE_KEY = "pihu.appearance";

export function isThemeKey(v: unknown): v is ThemeKey {
  return typeof v === "string" && (THEMES.some((t) => t.key === v) || LEGACY_THEMES.includes(v as ThemeKey));
}

const LEGACY_THEMES: ThemeKey[] = [
  "butterfly-dream",
  "cloud-garden",
  "sakura-night",
  "moonlight",
  "ocean-breeze",
  "sunset-glow",
  "forest-calm",
  "lavender-mist",
  "peach-cream",
  "midnight-rose",
];

function normalizeColors(v: unknown): CustomColors {
  if (!v || typeof v !== "object") return EMPTY_COLORS;
  const o = v as Partial<CustomColors>;
  return {
    primary: o.primary ?? "",
    secondary: o.secondary ?? "",
    button: o.button ?? "",
    link: o.link ?? "",
    card: o.card ?? "",
  };
}

export function readStoredAppearance(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    return { ...DEFAULT_APPEARANCE, ...parsed, colors: normalizeColors(parsed.colors) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function storeAppearance(a: Appearance) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Applies appearance tokens to <html>. Safe to call repeatedly. */
export function applyAppearance(a: Appearance) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  const theme = isThemeKey(a.theme) ? a.theme : DEFAULT_APPEARANCE.theme;
  el.setAttribute("data-theme", theme);
  el.classList.toggle("dark", !!a.dark || DARK_THEMES.includes(theme));

  if (a.accent) {
    el.setAttribute("data-accent", "custom");
    el.style.setProperty("--accent-custom", a.accent);
  } else {
    el.removeAttribute("data-accent");
    el.style.removeProperty("--accent-custom");
  }

  el.setAttribute("data-font", a.font ?? "sans");
  const scale = SCALES.find((s) => s.key === a.scale) ?? SCALES[1];
  el.style.setProperty("--font-scale", String(scale.value));

  const ls = LETTER_SPACINGS.find((s) => s.key === a.letterSpacing) ?? LETTER_SPACINGS[1];
  const lh = LINE_SPACINGS.find((s) => s.key === a.lineSpacing) ?? LINE_SPACINGS[1];
  el.style.setProperty("--journal-letter-spacing", ls.value);
  el.style.setProperty("--journal-line-height", lh.value);

  const c = normalizeColors(a.colors);
  setVar(el, "--primary", c.primary);
  setVar(el, "--ring", c.primary);
  setVar(el, "--secondary", c.secondary);
  setVar(el, "--button", c.button);
  setVar(el, "--link", c.link);
  toggleAttr(el, "data-custom-button", !!c.button);
  toggleAttr(el, "data-custom-link", !!c.link);
  if (c.card) {
    el.style.setProperty("--gradient-card", `linear-gradient(180deg, ${c.card}, ${c.card})`);
  } else {
    el.style.removeProperty("--gradient-card");
  }
}

function setVar(el: HTMLElement, name: string, value: string) {
  if (value) el.style.setProperty(name, value);
  else el.style.removeProperty(name);
}

function toggleAttr(el: HTMLElement, name: string, on: boolean) {
  if (on) el.setAttribute(name, "");
  else el.removeAttribute(name);
}

/** Maps a profile row to an Appearance object. */
export function appearanceFromProfile(p: {
  theme?: string | null;
  accent_color?: string | null;
  dark_mode?: boolean | null;
  font_family?: string | null;
  font_scale?: string | null;
  letter_spacing?: string | null;
  line_spacing?: string | null;
  custom_colors?: unknown;
} | null | undefined): Appearance {
  if (!p) return DEFAULT_APPEARANCE;
  return {
    theme: isThemeKey(p.theme) ? p.theme : DEFAULT_APPEARANCE.theme,
    accent: p.accent_color ?? "",
    dark: !!p.dark_mode,
    font: (FONTS.find((f) => f.key === p.font_family)?.key ?? "sans") as FontKey,
    scale: (SCALES.find((s) => s.key === p.font_scale)?.key ?? "md") as ScaleKey,
    letterSpacing: (LETTER_SPACINGS.find((s) => s.key === p.letter_spacing)?.key ?? "normal") as SpacingKey,
    lineSpacing: (LINE_SPACINGS.find((s) => s.key === p.line_spacing)?.key ?? "normal") as SpacingKey,
    colors: normalizeColors(p.custom_colors),
  };
}
