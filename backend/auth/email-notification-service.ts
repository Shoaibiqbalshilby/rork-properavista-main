import nodemailer from 'nodemailer';

const DEFAULT_LOGIN_URL = 'https://properavista.com/login';
const DEFAULT_SUPPORT_EMAIL = 'Support@60secondsapp.io';
const DEFAULT_SUPPORT_NAME = '60seconds Support';

const getEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
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
};

const tryEmailProviders = async (providers: Array<() => Promise<boolean>>) => {
  for (const provider of providers) {
    try {
      if (await provider()) {
        return true;
      }
    } catch (error) {
      console.error('Transactional email provider failed:', error);
    }
  }

  return false;
};

const sendViaSmtp = async (
  email: string,
  subject: string,
  html: string,
  text: string,
  fromEmail?: string,
  fromName?: string
) => {
  const host = getEnv('SMTP_HOST');
  const portValue = getEnv('SMTP_PORT');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  const from = fromEmail || getEnv('SMTP_FROM_EMAIL', 'SUPPORT_EMAIL_FROM', 'PASSWORD_RESET_EMAIL_FROM');

  if (!host || !portValue || !user || !pass || !from) {
    return false;
  }

  const port = Number(portValue);

  if (!Number.isFinite(port)) {
    throw new Error('SMTP_PORT must be a valid number');
  }

  const secureSetting = getEnv('SMTP_SECURE');
  const secure = secureSetting ? secureSetting.toLowerCase() === 'true' : port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: fromName ? `"${fromName}" <${from}>` : from,
    to: email,
    subject,
    text,
    html,
  });

  return true;
};

const sendViaResend = async (email: string, subject: string, html: string, text: string) => {
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
      subject,
      html,
      text,
    },
    {
      Authorization: `Bearer ${apiKey}`,
    }
  );

  return true;
};

const sendViaSendGrid = async (
  email: string,
  subject: string,
  html: string,
  text: string,
  fromEmail?: string,
  fromName?: string
) => {
  const apiKey = getEnv('SENDGRID_API_KEY');
  const from = fromEmail || getEnv('PASSWORD_RESET_EMAIL_FROM', 'SENDGRID_FROM_EMAIL');

  if (!apiKey || !from) {
    return false;
  }

  await postJson(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email }] }],
      from: fromName ? { email: from, name: fromName } : { email: from },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    },
    {
      Authorization: `Bearer ${apiKey}`,
    }
  );

  return true;
};

export const hasTransactionalEmailProviderConfigured = () => {
  const smtpConfigured =
    !!getEnv('SMTP_HOST') &&
    !!getEnv('SMTP_PORT') &&
    !!getEnv('SMTP_USER') &&
    !!getEnv('SMTP_PASS') &&
    !!getEnv('SMTP_FROM_EMAIL', 'SUPPORT_EMAIL_FROM', 'PASSWORD_RESET_EMAIL_FROM');
  const resendConfigured = !!getEnv('RESEND_API_KEY') && !!getEnv('PASSWORD_RESET_EMAIL_FROM', 'RESEND_FROM_EMAIL');
  const sendGridConfigured = !!getEnv('SENDGRID_API_KEY') && !!getEnv('PASSWORD_RESET_EMAIL_FROM', 'SENDGRID_FROM_EMAIL');

  return smtpConfigured || resendConfigured || sendGridConfigured;
};

const allowDevEmailLoggingFallback = () => !hasTransactionalEmailProviderConfigured() && process.env.NODE_ENV !== 'production';

export async function sendSignupConfirmationEmail(
  email: string,
  confirmUrl: string,
  loginUrl = DEFAULT_LOGIN_URL
): Promise<boolean> {
  const subject = 'Confirm your Properavista email';
  const html = `
    <h2>Confirm Your Email</h2>
    <p>Click the button below to confirm your Properavista account email address.</p>
    <p>
      <a
        href="${confirmUrl}"
        style="display:inline-block;padding:12px 20px;background:#6ea0d4;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
      >
        Confirm your mail
      </a>
    </p>
    <p>If the button does not work, use this link:</p>
    <p><a href="${confirmUrl}">${confirmUrl}</a></p>
    <p>After confirmation, you will be redirected to Properavista and can sign in at <a href="${loginUrl}">${loginUrl}</a>.</p>
    <p>If you did not create this account, you can ignore this email.</p>
  `;
  const text = `Confirm your Properavista email: ${confirmUrl}\n\nAfter confirmation, you can sign in at ${loginUrl}.`;

  const delivered = await tryEmailProviders([
    () => sendViaSmtp(email, subject, html, text),
    () => sendViaSendGrid(email, subject, html, text),
    () => sendViaResend(email, subject, html, text),
  ]);

  if (delivered) {
    return true;
  }

  if (allowDevEmailLoggingFallback()) {
    console.log(`[SignupConfirmationEmail] No provider configured. Confirmation email for ${email}: ${confirmUrl}`);
    return true;
  }

  return false;
}

export async function sendSignupConfirmedEmail(
  email: string,
  loginUrl = DEFAULT_LOGIN_URL
): Promise<boolean> {
  const subject = 'Your Properavista email has been confirmed';
  const html = `
    <h2>Email Confirmed</h2>
    <p>Your Properavista email address has been confirmed successfully.</p>
    <p>You can now sign in again with your registered credentials.</p>
    <p><a href="${loginUrl}">Go to Properavista</a></p>
  `;
  const text = `Your Properavista email has been confirmed. You can now sign in again at ${loginUrl} with your registered credentials.`;

  const delivered = await tryEmailProviders([
    () => sendViaSmtp(email, subject, html, text),
    () => sendViaSendGrid(email, subject, html, text),
    () => sendViaResend(email, subject, html, text),
  ]);

  if (delivered) {
    return true;
  }

  if (allowDevEmailLoggingFallback()) {
    console.log(`[SignupConfirmedEmail] No provider configured. Confirmation email for ${email}: ${loginUrl}`);
    return true;
  }

  return false;
}

export async function sendSignupPinEmail(
  email: string,
  pinCode: string,
  recipientName?: string
): Promise<boolean> {
  const firstName = recipientName?.trim()?.split(/\s+/)[0] || 'there';
  const subject = 'Your Properavista verification PIN';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;">
      <h2 style="margin-bottom:16px;">Verify your Properavista email</h2>
      <p>Hello ${firstName},</p>
      <p>Your Properavista sign-up PIN is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0;color:#111827;">${pinCode}</p>
      <p>Enter this PIN in the Properavista app to confirm your account. This code expires in 15 minutes.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;
  const text = `Your Properavista sign-up PIN is ${pinCode}. Enter this PIN in the Properavista app to confirm your account. This code expires in 15 minutes.`;

  const delivered = await tryEmailProviders([
    () =>
      sendViaSmtp(
        email,
        subject,
        html,
        text,
        getEnv('SMTP_FROM_EMAIL', 'SUPPORT_EMAIL_FROM', 'PASSWORD_RESET_EMAIL_FROM') || DEFAULT_SUPPORT_EMAIL,
        getEnv('SMTP_FROM_NAME', 'SUPPORT_EMAIL_NAME') || DEFAULT_SUPPORT_NAME,
      ),
    () =>
      sendViaSendGrid(
        email,
        subject,
        html,
        text,
        getEnv('SUPPORT_EMAIL_FROM', 'SENDGRID_SUPPORT_FROM_EMAIL', 'PASSWORD_RESET_EMAIL_FROM', 'SENDGRID_FROM_EMAIL') || DEFAULT_SUPPORT_EMAIL,
        getEnv('SUPPORT_EMAIL_NAME') || DEFAULT_SUPPORT_NAME,
      ),
    () => sendViaResend(email, subject, html, text),
  ]);

  if (delivered) {
    return true;
  }

  if (allowDevEmailLoggingFallback()) {
    console.log(`[SignupPinEmail] No provider configured. Verification PIN for ${email}: ${pinCode}`);
    return true;
  }

  return false;
}

export async function sendWelcomeEmail(
  email: string,
  recipientName?: string,
  loginUrl = DEFAULT_LOGIN_URL
): Promise<boolean> {
  const greetingName = recipientName?.trim() || email.split('@')[0] || 'there';
  const subject = 'Welcome to Properavista';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;">
      <h1 style="margin-bottom:16px;">Welcome to Properavista - Your Gateway to Premium Properties!</h1>
      <p>Dear ${greetingName},</p>
      <p>Welcome to Properavista!</p>
      <p>I'm Coolman Chidiagba, CEO and Founder of Properavista, and I'm thrilled to have you join our growing community. Whether you're exploring our mobile app or web platform, we're here to make discovering and listing premium properties across Nigeria simple, smart, reliable and seamless.</p>
      <p>Start browsing exclusive listings, list your own property with ease, or connect with like-minded real estate enthusiasts - all in one intuitive platform.</p>
      <p>If you have any questions or need assistance, our support team is just a message away.</p>
      <p>Here's to finding your next dream property!</p>
      <p>Best regards,<br/>Coolman Chidiagba<br/>CEO &amp; Founder<br/>Properavista<br/><a href="https://properavista.com">properavista.com</a></p>
      <p>Download our mobile app for on-the-go access.</p>
      <p><a href="${loginUrl}">${loginUrl}</a></p>
    </div>
  `;
  const text = `Welcome to Properavista

Dear ${greetingName},

Welcome to Properavista!

I'm Coolman Chidiagba, CEO and Founder of Properavista, and I'm thrilled to have you join our growing community. Whether you're exploring our mobile app or web platform, we're here to make discovering and listing premium properties across Nigeria simple, smart, reliable and seamless.

Start browsing exclusive listings, list your own property with ease, or connect with like-minded real estate enthusiasts - all in one intuitive platform.

If you have any questions or need assistance, our support team is just a message away.

Here's to finding your next dream property!

Best regards,
Coolman Chidiagba
CEO & Founder
Properavista
properavista.com

Download our mobile app for on-the-go access.

${loginUrl}`;

  const delivered = await tryEmailProviders([
    () =>
      sendViaSmtp(
        email,
        subject,
        html,
        text,
        getEnv('SMTP_FROM_EMAIL', 'SUPPORT_EMAIL_FROM') || DEFAULT_SUPPORT_EMAIL,
        getEnv('SMTP_FROM_NAME', 'SUPPORT_EMAIL_NAME') || DEFAULT_SUPPORT_NAME,
      ),
    () =>
      sendViaSendGrid(
        email,
        subject,
        html,
        text,
        getEnv('SUPPORT_EMAIL_FROM', 'SENDGRID_SUPPORT_FROM_EMAIL') || DEFAULT_SUPPORT_EMAIL,
        getEnv('SUPPORT_EMAIL_NAME') || DEFAULT_SUPPORT_NAME,
      ),
    () => sendViaResend(email, subject, html, text),
  ]);

  if (delivered) {
    return true;
  }

  if (allowDevEmailLoggingFallback()) {
    console.log(`[WelcomeEmail] No provider configured. Welcome email for ${email}`);
    return true;
  }

  return false;
}