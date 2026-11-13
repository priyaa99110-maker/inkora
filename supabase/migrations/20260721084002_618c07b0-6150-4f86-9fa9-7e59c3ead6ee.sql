
-- Roles enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security-definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can see their own roles
DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Moderation columns
ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS flagged_by uuid;

ALTER TABLE public.gratitude_entries
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS flagged_by uuid;

ALTER TABLE public.mood_entries
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS flagged_by uuid;

-- Admin RLS policies for moderation
DROP POLICY IF EXISTS "admins read diary" ON public.diary_entries;
CREATE POLICY "admins read diary" ON public.diary_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update diary" ON public.diary_entries;
CREATE POLICY "admins update diary" ON public.diary_entries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins delete diary" ON public.diary_entries;
CREATE POLICY "admins delete diary" ON public.diary_entries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read gratitude" ON public.gratitude_entries;
CREATE POLICY "admins read gratitude" ON public.gratitude_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update gratitude" ON public.gratitude_entries;
CREATE POLICY "admins update gratitude" ON public.gratitude_entries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins delete gratitude" ON public.gratitude_entries;
CREATE POLICY "admins delete gratitude" ON public.gratitude_entries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read mood" ON public.mood_entries;
CREATE POLICY "admins read mood" ON public.mood_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update mood" ON public.mood_entries;
CREATE POLICY "admins update mood" ON public.mood_entries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins delete mood" ON public.mood_entries;
CREATE POLICY "admins delete mood" ON public.mood_entries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read all profiles
DROP POLICY IF EXISTS "admins read profiles" ON public.profiles;
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
