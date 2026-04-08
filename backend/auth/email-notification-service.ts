const DEFAULT_LOGIN_URL = 'https://properavista.com/login';

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

const sendViaSendGrid = async (email: string, subject: string, html: string, text: string) => {
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
  const resendConfigured = !!getEnv('RESEND_API_KEY') && !!getEnv('PASSWORD_RESET_EMAIL_FROM', 'RESEND_FROM_EMAIL');
  const sendGridConfigured = !!getEnv('SENDGRID_API_KEY') && !!getEnv('PASSWORD_RESET_EMAIL_FROM', 'SENDGRID_FROM_EMAIL');

  return resendConfigured || sendGridConfigured;
};

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

  try {
    if (await sendViaResend(email, subject, html, text)) {
      return true;
    }

    if (await sendViaSendGrid(email, subject, html, text)) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SignupConfirmationEmail] No provider configured. Confirmation email for ${email}: ${confirmUrl}`);
      return true;
    }
  } catch (error) {
    console.error('Failed to send signup confirmation email:', error);
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

  try {
    if (await sendViaResend(email, subject, html, text)) {
      return true;
    }

    if (await sendViaSendGrid(email, subject, html, text)) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SignupConfirmedEmail] No provider configured. Confirmation email for ${email}: ${loginUrl}`);
      return true;
    }
  } catch (error) {
    console.error('Failed to send signup confirmation email:', error);
  }

  return false;
}