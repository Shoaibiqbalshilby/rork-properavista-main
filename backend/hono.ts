import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { createClient, type EmailOtpType } from '@supabase/supabase-js';
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { z } from "zod";
import {
  confirmPasswordResetByPin,
  deleteAccountByUserId,
  requestPasswordResetByEmail,
  verifyPasswordResetPin,
} from "./auth/password-reset-service";
import { sendSignupConfirmedEmail, sendWelcomeEmail } from './auth/email-notification-service';
import {
  requestSignupVerification,
  resendSignupVerification,
  verifySignupVerification,
} from './auth/signup-verification-service';

// app will be mounted at /api
const app = new Hono();

const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(8, "PIN must be 8 digits"),
});

const confirmPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(8, "PIN must be 8 digits"),
  resetToken: z.string().uuid().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const requestSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

const verifySignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  pinCode: z.string().length(8, 'PIN must be 8 digits'),
});

const resendSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const getAuthenticatedUser = async (authorizationHeader?: string | null) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('You must be signed in to continue.');
  }

  const accessToken = authorizationHeader.slice('Bearer '.length).trim();

  if (!accessToken) {
    throw new Error('You must be signed in to continue.');
  }

  const publicSupabase = createPublicSupabaseClient();
  const { data, error } = await publicSupabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error('Your session is no longer valid. Please sign in again.');
  }

  return data.user;
};

const createPublicSupabaseClient = () => {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase public auth configuration is missing');
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

const getSafeRedirectUrl = (candidate?: string | null) => {
  const fallbackUrl = 'https://properavista.com/login?emailConfirmed=1';

  if (!candidate) {
    return fallbackUrl;
  }

  try {
    const url = new URL(candidate);
    if (url.hostname !== 'properavista.com' && url.hostname !== 'www.properavista.com') {
      return fallbackUrl;
    }

    return url.toString();
  } catch {
    return fallbackUrl;
  }
};

const renderConfirmationPage = (title: string, message: string, buttonLabel = 'Open Properavista Login') => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(180deg, #f7f9fc 0%, #edf2f8 100%);
        color: #1f2937;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .card {
        width: 100%;
        max-width: 560px;
        background: #ffffff;
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
        text-align: center;
      }

      h1 {
        font-size: 32px;
        margin: 0 0 16px;
      }

      p {
        font-size: 18px;
        line-height: 1.6;
        margin: 0 0 24px;
        color: #4b5563;
      }

      a {
        display: inline-block;
        padding: 14px 22px;
        border-radius: 12px;
        background: #111827;
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="https://properavista.com/login">${buttonLabel}</a>
    </main>
  </body>
</html>`;

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.post("/auth/password-reset/request", async (c) => {
  try {
    const body = requestPasswordResetSchema.parse(await c.req.json());
    return c.json(await requestPasswordResetByEmail(body.email));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process password reset request';
    return c.json({ success: false, message }, 400);
  }
});

app.post('/auth/signup/request', async (c) => {
  try {
    const body = requestSignupSchema.parse(await c.req.json());
    return c.json(await requestSignupVerification(body.name, body.email, body.password, body.phone, body.whatsapp));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    return c.json({ success: false, message }, 400);
  }
});

app.post('/auth/signup/verify', async (c) => {
  try {
    const body = verifySignupSchema.parse(await c.req.json());
    return c.json(await verifySignupVerification(body.email, body.pinCode));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup verification failed';
    return c.json({ success: false, message }, 400);
  }
});

app.post('/auth/signup/resend', async (c) => {
  try {
    const body = resendSignupSchema.parse(await c.req.json());
    return c.json(await resendSignupVerification(body.email));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend signup PIN';
    return c.json({ success: false, message }, 400);
  }
});

app.post("/auth/password-reset/verify", async (c) => {
  try {
    const body = verifyPasswordResetSchema.parse(await c.req.json());
    return c.json(await verifyPasswordResetPin(body.email, body.pinCode));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PIN verification failed';
    return c.json({ success: false, message }, 400);
  }
});

app.post("/auth/password-reset/confirm", async (c) => {
  try {
    const body = confirmPasswordResetSchema.parse(await c.req.json());
    return c.json(
      await confirmPasswordResetByPin(body.email, body.pinCode, body.newPassword, body.resetToken)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset failed';
    return c.json({ success: false, message }, 400);
  }
});

app.delete('/auth/account', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('authorization'));
    const userId = user.id;
    return c.json(await deleteAccountByUserId(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account deletion failed';
    return c.json({ success: false, message }, 400);
  }
});

app.post('/auth/signup/welcome', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('authorization'));

    if (!user.email) {
      throw new Error('Authenticated user email is missing.');
    }

    if (!user.email_confirmed_at) {
      throw new Error('Email verification is required before sending the welcome email.');
    }

    const welcomeEmailSent = await sendWelcomeEmail(
      user.email,
      typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined,
      'https://properavista.com/login'
    );

    if (!welcomeEmailSent) {
      return c.json({ success: false, message: 'Welcome email could not be sent.' }, 502);
    }

    return c.json({ success: true, message: 'Welcome email sent.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send welcome email';
    return c.json({ success: false, message }, 400);
  }
});

app.get('/auth/confirm-signup', async (c) => {
  const tokenHash = c.req.query('token_hash');
  const type = (c.req.query('type') || 'signup') as EmailOtpType;
  const emailConfirmed = c.req.query('emailConfirmed');

  if (!tokenHash && emailConfirmed === '1') {
    return c.html(
      renderConfirmationPage(
        'Confirmation Successful',
        'Your email address has been confirmed successfully. You can now sign in with your credentials.',
        'Open Properavista'
      )
    );
  }

  if (!tokenHash) {
    return c.html(
      renderConfirmationPage(
        'Confirmation Link Invalid',
        'This confirmation link is missing required details. Request a new confirmation email and try again.'
      ),
      400
    );
  }

  try {
    const publicSupabase = createPublicSupabaseClient();
    const { data, error } = await publicSupabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return c.html(
        renderConfirmationPage(
          'Confirmation Failed',
          'This confirmation link is invalid or has expired. Request a new confirmation email and try again.'
        ),
        400
      );
    }

    if (data.user?.email) {
      await sendSignupConfirmedEmail(data.user.email, 'https://properavista.com/login');
    }

    return c.html(
      renderConfirmationPage(
        'Confirmation Successful',
        'Your email address has been confirmed successfully. You can now sign in with your credentials.',
        'Open Properavista'
      )
    );
  } catch {
    return c.html(
      renderConfirmationPage(
        'Confirmation Error',
        'We could not complete your email confirmation right now. Please try again later.'
      ),
      500
    );
  }
});

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;