CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_code VARCHAR(6) NOT NULL,
  phone_number VARCHAR(20),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.password_reset_tokens
  ALTER COLUMN phone_number DROP NOT NULL;

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "password_reset_tokens_select_policy" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "password_reset_tokens_insert_policy" ON public.password_reset_tokens;

CREATE POLICY "password_reset_tokens_select_policy"
  ON public.password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "password_reset_tokens_insert_policy"
  ON public.password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON public.password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
  ON public.password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active_lookup
  ON public.password_reset_tokens(user_id, pin_code, is_used, expires_at DESC);

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(user_email))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.request_password_reset_pin(user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, reset_token_id UUID, pin_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT := lower(trim(user_email));
  target_user_id UUID;
  generated_pin TEXT;
  created_token_id UUID;
BEGIN
  SELECT public.get_auth_user_id_by_email(normalized_email)
    INTO target_user_id;

  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT true, 'If the account exists, a reset code has been generated.', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  UPDATE public.password_reset_tokens
  SET is_used = true
  WHERE user_id = target_user_id
    AND is_used = false;

  generated_pin := lpad((floor(random() * 1000000))::INT::TEXT, 6, '0');

  INSERT INTO public.password_reset_tokens (user_id, pin_code, phone_number, expires_at)
  VALUES (target_user_id, generated_pin, '', NOW() + INTERVAL '15 minutes')
  RETURNING id INTO created_token_id;

  RETURN QUERY SELECT true, 'Reset code created successfully.', created_token_id, generated_pin;
END;
$$;