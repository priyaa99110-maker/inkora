ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS template text,
  ADD COLUMN IF NOT EXISTS lock_hash text,
  ADD COLUMN IF NOT EXISTS lock_salt text,
  ADD COLUMN IF NOT EXISTS lock_hint text,
  ADD COLUMN IF NOT EXISTS lock_failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lock_locked_until timestamptz;

CREATE TABLE IF NOT EXISTS public.entry_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  caption text,
  width integer,
  height integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_media TO authenticated;
GRANT ALL ON public.entry_media TO service_role;

ALTER TABLE public.entry_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own entry media" ON public.entry_media
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read entry media" ON public.entry_media
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS entry_media_entry_id_idx ON public.entry_media(entry_id);