REVOKE EXECUTE ON FUNCTION public.redeem_referral(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_referral(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;