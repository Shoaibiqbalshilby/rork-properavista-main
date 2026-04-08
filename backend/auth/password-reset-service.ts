import { supabaseAdmin } from '@/lib/supabase';
import { generatePinCode, normalizeEmail, sendPinToEmail, validatePinFormat } from '@/utils/password-reset';

const findAuthUserIdByEmail = async (rawEmail: string) => {
  const email = normalizeEmail(rawEmail);

  const adminApi = (supabaseAdmin.auth.admin as any);
  if (typeof adminApi.getUserByEmail === 'function') {
    const { data, error } = await adminApi.getUserByEmail(email);

    if (error) {
      throw new Error(`Failed to validate account details: ${error.message}`);
    }

    if (data?.user?.id) {
      return data.user.id as string;
    }
  }

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_auth_user_id_by_email', {
    user_email: email,
  });

  if (!rpcError && rpcData) {
    return rpcData as string;
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (profileError) {
    throw new Error('Failed to validate account details');
  }

  return profileData?.id || null;
};

export const requestPasswordResetByEmail = async (rawEmail: string) => {
  const email = normalizeEmail(rawEmail);

  const userId = await findAuthUserIdByEmail(email);

  if (!userId) {
    return {
      success: true,
      message: 'If the account exists, a reset code has been sent to the registered email.',
    };
  }

  const pinCode = generatePinCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await supabaseAdmin
    .from('password_reset_tokens')
    .update({ is_used: true })
    .eq('user_id', userId)
    .eq('is_used', false);

  const { error: pinError } = await supabaseAdmin
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      pin_code: pinCode,
      phone_number: '',
      expires_at: expiresAt.toISOString(),
    });

  if (pinError) {
    throw new Error('Failed to generate reset code');
  }

  const emailSent = await sendPinToEmail(email, pinCode);

  if (!emailSent) {
    throw new Error('Failed to send reset code to email. Please try again.');
  }

  return {
    success: true,
    message: 'Reset code sent to your registered email',
    debugPin: process.env.NODE_ENV === 'production' ? undefined : pinCode,
  };
};

export const verifyPasswordResetPin = async (rawEmail: string, pinCode: string) => {
  const email = normalizeEmail(rawEmail);

  if (!validatePinFormat(pinCode)) {
    throw new Error('Invalid PIN format');
  }

  const userId = await findAuthUserIdByEmail(email);

  if (!userId) {
    throw new Error('User not found');
  }

  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('password_reset_tokens')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('pin_code', pinCode)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired PIN');
  }

  return {
    success: true,
    message: 'PIN verified successfully',
    resetToken: tokenData.id,
    expiresAt: tokenData.expires_at,
  };
};

export const confirmPasswordResetByPin = async (
  rawEmail: string,
  pinCode: string,
  newPassword: string,
  resetToken?: string
) => {
  const email = normalizeEmail(rawEmail);

  if (!validatePinFormat(pinCode)) {
    throw new Error('Invalid PIN format');
  }

  const userId = await findAuthUserIdByEmail(email);

  if (!userId) {
    throw new Error('User not found');
  }

  let tokenQuery = supabaseAdmin
    .from('password_reset_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('pin_code', pinCode)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (resetToken) {
    tokenQuery = tokenQuery.eq('id', resetToken);
  }

  const { data: tokenData, error: tokenError } = await tokenQuery.maybeSingle();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired PIN');
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    throw new Error(`Failed to reset password: ${updateError.message}`);
  }

  await supabaseAdmin
    .from('password_reset_tokens')
    .update({ is_used: true })
    .eq('id', tokenData.id);

  return {
    success: true,
    message: 'Password reset successfully',
  };
};