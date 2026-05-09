CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.signup_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_code VARCHAR(8) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.signup_verification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signup_verification_tokens_select_policy" ON public.signup_verification_tokens;
DROP POLICY IF EXISTS "signup_verification_tokens_insert_policy" ON public.signup_verification_tokens;

CREATE POLICY "signup_verification_tokens_select_policy"
  ON public.signup_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "signup_verification_tokens_insert_policy"
  ON public.signup_verification_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_signup_verification_tokens_user_id
  ON public.signup_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_signup_verification_tokens_expires_at
  ON public.signup_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_signup_verification_tokens_active_lookup
  ON public.signup_verification_tokens(user_id, pin_code, is_used, expires_at DESC);