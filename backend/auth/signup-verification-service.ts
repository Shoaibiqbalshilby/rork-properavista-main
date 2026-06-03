import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePinCode, normalizeEmail, validatePinFormat } from '@/utils/password-reset';
import { sendSignupPinEmail } from './email-notification-service';

type SignupVerificationUser = {
  id: string;
  email: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type SignupProfileLookup = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const SIGNUP_PIN_TTL_MINUTES = 15;
const SIGNUP_VERIFICATION_STORAGE_PROBE_USER_ID = '00000000-0000-0000-0000-000000000000';

let customSignupVerificationStorageAvailable: boolean | null = null;

const createPublicSupabaseClient = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase public auth configuration is missing');
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const isMissingSignupVerificationStorageError = (error: { message?: string } | null | undefined) =>
  !!error?.message && error.message.includes("Could not find the table 'public.signup_verification_tokens'");

const canUseCustomSignupVerificationStorage = async () => {
  if (customSignupVerificationStorageAvailable !== null) {
    return customSignupVerificationStorageAvailable;
  }

  const { error } = await supabaseAdmin
    .from('signup_verification_tokens')
    .update({ is_used: true })
    .eq('user_id', SIGNUP_VERIFICATION_STORAGE_PROBE_USER_ID)
    .eq('is_used', false);

  if (isMissingSignupVerificationStorageError(error)) {
    customSignupVerificationStorageAvailable = false;
    return false;
  }

  if (error) {
    throw new Error(`Failed to access signup verification storage: ${error.message}`);
  }

  customSignupVerificationStorageAvailable = true;
  return true;
};

const getAuthUserByEmail = async (rawEmail: string): Promise<SignupVerificationUser | null> => {
  const email = normalizeEmail(rawEmail);
  const adminApi = supabaseAdmin.auth.admin as any;

  if (typeof adminApi.getUserByEmail === 'function') {
    const { data, error } = await adminApi.getUserByEmail(email);

    if (error) {
      throw new Error(`Failed to validate account details: ${error.message}`);
    }

    return (data?.user as SignupVerificationUser | null) || null;
  }

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_auth_user_id_by_email', {
    user_email: email,
  });

  if (rpcError || !rpcData) {
    return null;
  }

  if (typeof adminApi.getUserById === 'function') {
    const { data, error } = await adminApi.getUserById(rpcData);

    if (error) {
      throw new Error(`Failed to validate account details: ${error.message}`);
    }

    return (data?.user as SignupVerificationUser | null) || null;
  }

  if (rpcData) {
    return {
      id: String(rpcData),
      email,
      email_confirmed_at: null,
    };
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, name, phone, whatsapp')
    .ilike('email', email)
    .maybeSingle<SignupProfileLookup>();

  if (profileError) {
    throw new Error(`Failed to validate account details: ${profileError.message}`);
  }

  if (!profileData) {
    return null;
  }

  if (typeof adminApi.getUserById === 'function') {
    const { data, error } = await adminApi.getUserById(profileData.id);

    if (error) {
      throw new Error(`Failed to validate account details: ${error.message}`);
    }

    if (data?.user) {
      return data.user as SignupVerificationUser;
    }
  }

  return {
    id: profileData.id,
    email: profileData.email,
    email_confirmed_at: null,
    user_metadata: {
      name: profileData.name,
      phone: profileData.phone,
      whatsapp: profileData.whatsapp,
    },
  };
};

const invalidateActiveSignupPins = async (userId: string) => {
  const { error } = await supabaseAdmin
    .from('signup_verification_tokens')
    .update({ is_used: true })
    .eq('user_id', userId)
    .eq('is_used', false);

  if (error) {
    throw new Error('Failed to invalidate previous signup verification codes');
  }
};

const createSignupPin = async (userId: string) => {
  const pinCode = generatePinCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SIGNUP_PIN_TTL_MINUTES);

  const { error } = await supabaseAdmin
    .from('signup_verification_tokens')
    .insert({
      user_id: userId,
      pin_code: pinCode,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error('Failed to generate signup verification PIN');
  }

  return pinCode;
};

const upsertUserProfile = async (
  userId: string,
  email: string,
  name?: string,
  phone?: string,
  whatsapp?: string,
) => {
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        email,
        name: name || '',
        phone: phone || null,
        whatsapp: whatsapp || null,
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

const requestNativeSignupVerification = async (
  name: string,
  rawEmail: string,
  password: string,
  phone?: string,
  whatsapp?: string,
) => {
  const email = normalizeEmail(rawEmail);
  const publicSupabase = createPublicSupabaseClient();

  const { data, error } = await publicSupabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        whatsapp,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create account');
  }

  if (!data.user) {
    throw new Error('Failed to create account');
  }

  await upsertUserProfile(data.user.id, email, name, phone, whatsapp);

  return {
    success: true,
    message: 'Your account has been created. We sent a verification PIN to your email. Enter that PIN to confirm your account and finish signing in.',
  };
};

const resendNativeSignupVerification = async (rawEmail: string) => {
  const email = normalizeEmail(rawEmail);
  const publicSupabase = createPublicSupabaseClient();

  const { error } = await publicSupabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw new Error(error.message || 'Failed to resend verification PIN email. Please try again.');
  }

  return {
    success: true,
    message: 'A new verification PIN has been sent to your email.',
  };
};

export const requestSignupVerification = async (
  name: string,
  rawEmail: string,
  password: string,
  phone?: string,
  whatsapp?: string,
) => {
  if (!(await canUseCustomSignupVerificationStorage())) {
    return requestNativeSignupVerification(name, rawEmail, password, phone, whatsapp);
  }

  const email = normalizeEmail(rawEmail);
  const metadata = {
    name,
    phone,
    whatsapp,
  };

  let user = await getAuthUserByEmail(email);

  if (user?.email_confirmed_at) {
    throw new Error('An account with this email already exists. Please sign in.');
  }

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: metadata,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to create account');
    }

    user = data.user as SignupVerificationUser;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      user_metadata: metadata,
      email_confirm: false,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to update pending account');
    }

    user = data.user as SignupVerificationUser;
  }

  await upsertUserProfile(user.id, email, name, phone, whatsapp);
  await invalidateActiveSignupPins(user.id);
  const pinCode = await createSignupPin(user.id);

  const emailSent = await sendSignupPinEmail(email, pinCode, name);

  if (!emailSent) {
    throw new Error('Failed to send verification PIN email. Please try again.');
  }

  return {
    success: true,
    message: 'Your account has been created. We sent a verification PIN to your email. Enter that PIN to confirm your account and finish signing in.',
    debugPin: process.env.NODE_ENV === 'production' ? undefined : pinCode,
  };
};

export const resendSignupVerification = async (rawEmail: string) => {
  if (!(await canUseCustomSignupVerificationStorage())) {
    return resendNativeSignupVerification(rawEmail);
  }

  const email = normalizeEmail(rawEmail);
  const user = await getAuthUserByEmail(email);

  if (!user) {
    throw new Error('Create your account first before requesting a verification PIN.');
  }

  if (user.email_confirmed_at) {
    throw new Error('This account is already verified. Please sign in.');
  }

  await invalidateActiveSignupPins(user.id);
  const pinCode = await createSignupPin(user.id);

  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined;
  const emailSent = await sendSignupPinEmail(email, pinCode, name);

  if (!emailSent) {
    throw new Error('Failed to resend verification PIN email. Please try again.');
  }

  return {
    success: true,
    message: 'A new verification PIN has been sent to your email.',
    debugPin: process.env.NODE_ENV === 'production' ? undefined : pinCode,
  };
};

export const verifySignupVerification = async (rawEmail: string, pinCode: string) => {
  if (!(await canUseCustomSignupVerificationStorage())) {
    throw new Error('Signup verification failed');
  }

  const email = normalizeEmail(rawEmail);

  if (!validatePinFormat(pinCode)) {
    throw new Error('Invalid PIN format');
  }

  const user = await getAuthUserByEmail(email);

  if (!user) {
    throw new Error('Account not found');
  }

  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('signup_verification_tokens')
    .select('id')
    .eq('user_id', user.id)
    .eq('pin_code', pinCode)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired verification PIN');
  }

  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (confirmError) {
    throw new Error(`Failed to verify account: ${confirmError.message}`);
  }

  await supabaseAdmin
    .from('signup_verification_tokens')
    .update({ is_used: true })
    .eq('id', tokenData.id);

  return {
    success: true,
    message: 'User registration successful.',
  };
};