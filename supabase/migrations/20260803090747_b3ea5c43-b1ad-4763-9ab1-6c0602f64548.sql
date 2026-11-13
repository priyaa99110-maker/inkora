ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS letter_spacing text,
  ADD COLUMN IF NOT EXISTS line_spacing text,
  ADD COLUMN IF NOT EXISTS custom_colors jsonb;

UPDATE public.profiles
SET referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

CREATE OR REPLACE FUNCTION public.redeem_referral(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _referrer uuid;
  _already uuid;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT referred_by INTO _already FROM public.profiles WHERE id = _me;
  IF _already IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You have already used a referral code');
  END IF;

  SELECT id INTO _referrer FROM public.profiles WHERE referral_code = upper(trim(_code));
  IF _referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'That code does not exist');
  END IF;
  IF _referrer = _me THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You cannot refer yourself');
  END IF;

  UPDATE public.profiles SET referred_by = _referrer, xp = xp + 50 WHERE id = _me;
  UPDATE public.profiles SET referral_count = referral_count + 1, xp = xp + 100 WHERE id = _referrer;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;