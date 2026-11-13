ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS dark_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS font_family text,
  ADD COLUMN IF NOT EXISTS font_scale text;