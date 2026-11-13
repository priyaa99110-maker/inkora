## Goal

Upgrade the existing Pihu Journal into a premium journaling app without breaking current routes, data, or auth. Everything is additive: existing plain-text entries keep working, existing tables keep their columns, existing pages keep their flow.

The app today is small (diary, gratitude, mood, todo, calendar, dashboard, settings, admin, auth). That makes the upgrade safe but it is still ~5 phases of work — I'd deliver it in order, verifying after each phase.

## Phase 1 — Rich text editor + live stats + AI assistant

- Add a TipTap-based editor component (`src/components/editor/`) used by the diary page, replacing the plain textarea while reading/writing the same `content` column. Plain text loads fine; new content saves as HTML (detected and rendered safely, sanitized to prevent XSS).
- Toolbar: bold, italic, underline, strikethrough, H1–H6, paragraph, bullet/numbered/check lists, quote, divider, alignment, undo/redo.
- Typography controls: font family, font size, letter spacing, line height, paragraph spacing.
- Colors: text color and highlight pickers wired to theme tokens plus custom values.
- Insert tools: emoji picker, sticker/decorative icon set (flowers, hearts, stars), image insert, dividers, GIF search (needs a Giphy or Tenor API key — I'll ask when we get there).
- Live stats bar: words, characters, paragraphs, reading time, last edited.
- AI assistant panel powered by Lovable AI (no key needed): auto-format/grammar, 12 rewrite styles, 12 emotional tones. Always shows a diff-style preview with Apply / Discard — never overwrites silently.

## Phase 2 — Personalization

- Theme switcher with 10 themes (Light, Dark, Midnight, Forest, Lavender, Ocean, Sunset, Sakura Pink, Beige Paper, Minimal White) as CSS token sets; persisted to the existing `profiles.theme` column.
- Custom accent colors (primary, secondary, button, link, card) and writing font choice, saved per user in new profile columns.

## Phase 3 — Entry features

- Templates (14 prompts: daily, gratitude, reflection, morning pages, dream, travel, mood, goals, weekly/monthly review, productivity, meeting notes, free writing) — prefill only, never restrictive.
- Per-entry lock with PIN or password: hashed server-side, content hidden until unlocked, change PIN, remove lock, failed-attempt lockout.
- Photos & media: drag-and-drop multi-image upload to a private storage bucket with client-side compression, preview, remove, in-entry gallery.
- Tags (existing `tags` column) with create/filter UI, mood per entry surfaced on cards/calendar/dashboard, favorites page and filter (existing `is_favorite` column).

## Phase 4 — Navigation, search, dashboard

- Calendar upgrade: month/week views, year nav, entry-day highlighting, mood icons, hover previews, click-to-open, smooth transitions.
- Search & filters: full-text over title/content plus mood, template, date range, favorites, locked.
- Dashboard: totals, writing streak, mood summary, weekly/monthly activity charts, recent created/edited, favorites.
- Optional reminders (daily / weekly / streak) using the existing `reminder_time` field, opt-in.

## Phase 5 — Auth, security, polish

- Auth: keep existing accounts untouched. Add Remember Me, strong-password validation, verified forgot/reset flow, optional email verification, auth rate limiting.
- Security pass: zod validation on every input, HTML sanitization, signed private storage URLs, server-side authorization on all new server functions.
- UI/UX pass: consistent design system, modern cards, better spacing/typography, animations, FAB, empty states, skeleton loaders, mobile refinements, a11y (focus, labels, contrast).
- Performance: route-level code splitting, lazy-loaded editor/emoji/GIF bundles, memoization, image optimization.

## Technical notes

- Database changes are additive only: new nullable columns on `diary_entries` (template, lock hash, media, font/spacing prefs) and `profiles` (accent colors, writing font, reminder prefs), plus a new `entry_media` table and private storage bucket. No column drops, no policy loosening; every new table ships with GRANTs and owner-scoped RLS.
- AI runs server-side through a `createServerFn` on the Lovable AI Gateway with `openai/gpt-5.6-sol`; no keys for you to manage.
- GIF support is the only feature needing an external key (Giphy or Tenor). If you'd rather skip it, I'll ship stickers/emoji only.

## Suggested start

Phase 1 delivers the biggest visible jump. I'd start there and check in with you before moving to Phase 2.
