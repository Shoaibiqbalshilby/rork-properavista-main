export const PASSWORD_RESET_PIN_LENGTH = 8;
export const SUPABASE_PASSWORD_RESET_PIN_MIN_LENGTH = 6;
export const SUPABASE_PASSWORD_RESET_PIN_MAX_LENGTH = 8;

/**
 * Generate a random numeric reset PIN.
 */
export function generatePinCode(): string {
  const min = 10 ** (PASSWORD_RESET_PIN_LENGTH - 1);
  const max = (10 ** PASSWORD_RESET_PIN_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

const PASSWORD_RESET_SUBJECT = 'Properavista password reset code';
const PASSWORD_RESET_MESSAGE = (pin: string) =>
  `Your Properavista password reset code is ${pin}. It expires in 15 minutes.`;

const isProduction = process.env.NODE_ENV === 'production';

const getEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const logDevFallback = (channel: 'email' | 'sms', recipient: string, pin: string) => {
  if (isProduction) {
    return false;
  }

  console.log(`[PasswordReset:${channel}] No provider configured. PIN ${pin} for ${recipient}`);
  return true;
};

const postJson = async (url: string, payload: unknown, headers: Record<string, string>) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response;
};

const sendViaResend = async (email: string, pin: string) => {
  const apiKey = getEnv('RESEND_API_KEY');
  const from = getEnv('PASSWORD_RESET_EMAIL_FROM', 'RESEND_FROM_EMAIL');

  if (!apiKey || !from) {
    return false;
  }

  await postJson(
    'https://api.resend.com/emails',
    {
      from,
      to: [email],
      subject: PASSWORD_RESET_SUBJECT,
      text: PASSWORD_RESET_MESSAGE(pin),
    },
    {
      Authorization: `Bearer ${apiKey}`,
    }
  );

  return true;
};

const sendViaSendGrid = async (email: string, pin: string) => {
  const apiKey = getEnv('SENDGRID_API_KEY');
  const from = getEnv('PASSWORD_RESET_EMAIL_FROM', 'SENDGRID_FROM_EMAIL');

  if (!apiKey || !from) {
    return false;
  }

  await postJson(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email }] }],
      from: { email: from },
      subject: PASSWORD_RESET_SUBJECT,
      content: [{ type: 'text/plain', value: PASSWORD_RESET_MESSAGE(pin) }],
    },
    {
      Authorization: `Bearer ${apiKey}`,
    }
  );

  return true;
};

const sendViaTermii = async (phoneNumber: string, pin: string) => {
  const apiKey = getEnv('TERMII_API_KEY');
  const senderId = getEnv('TERMII_SENDER_ID');
  const channel = getEnv('TERMII_CHANNEL') || 'generic';

  if (!apiKey || !senderId) {
    return false;
  }

  await postJson(
    'https://api.ng.termii.com/api/sms/send',
    {
      api_key: apiKey,
      to: phoneNumber,
      from: senderId,
      sms: PASSWORD_RESET_MESSAGE(pin),
      type: 'plain',
      channel,
    },
    {}
  );

  return true;
};

const sendViaTwilio = async (phoneNumber: string, pin: string) => {
  const accountSid = getEnv('TWILIO_ACCOUNT_SID');
  const authToken = getEnv('TWILIO_AUTH_TOKEN');
  const from = getEnv('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !from) {
    return false;
  }

  const body = new URLSearchParams({
    To: phoneNumber,
    From: from,
    Body: PASSWORD_RESET_MESSAGE(pin),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Twilio request failed with status ${response.status}`);
  }

  return true;
};

/**
 * Normalize email for comparisons.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateSupabasePasswordResetOtp(pin: string): boolean {
  return new RegExp(
    `^\\d{${SUPABASE_PASSWORD_RESET_PIN_MIN_LENGTH},${SUPABASE_PASSWORD_RESET_PIN_MAX_LENGTH}}$`
  ).test(pin);
}

export function validatePinFormat(pin: string): boolean {
  return new RegExp(`^\\d{${PASSWORD_RESET_PIN_LENGTH}}$`).test(pin);
}

/**
 * Format phone number for storage
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+234${digits}`;
  }

  if (digits.length === 13 && digits.startsWith('234')) {
    return `+${digits}`;
  }

  return digits.startsWith('234') ? `+${digits}` : `+${digits}`;
}

/**
 * Validate Nigerian phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Nigeria phone numbers: +234XXXXXXXXXX (11 digits after +234)
  return /^\+234\d{10}$/.test(formatted);
}

/**
 * Send PIN via email.
 *
 * Supported providers, in order:
 * 1. Resend: RESEND_API_KEY + PASSWORD_RESET_EMAIL_FROM
 * 2. SendGrid: SENDGRID_API_KEY + PASSWORD_RESET_EMAIL_FROM
 */
export async function sendPinToEmail(email: string, pin: string): Promise<boolean> {
  const providers = [
    () => sendViaResend(email, pin),
    () => sendViaSendGrid(email, pin),
  ];

  for (const provider of providers) {
    try {
      if (await provider()) {
        return true;
      }
    } catch (error) {
      console.error('Email provider failed while sending reset PIN:', error);
    }
  }

  return logDevFallback('email', email, pin);
}

/**
 * Send PIN via SMS.
 *
 * Supported providers, in order:
 * 1. Termii: TERMII_API_KEY + TERMII_SENDER_ID
 * 2. Twilio: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER
 */
export async function sendPinToSms(phoneNumber: string, pin: string): Promise<boolean> {
  try {
    if (await sendViaTermii(phoneNumber, pin)) {
      return true;
    }

    if (await sendViaTwilio(phoneNumber, pin)) {
      return true;
    }

    return logDevFallback('sms', phoneNumber, pin);
  } catch (error) {
    console.error('Error sending PIN to SMS:', error);
    return false;
  }
}
