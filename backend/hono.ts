import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { createClient, type EmailOtpType } from '@supabase/supabase-js';
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { z } from "zod";
import {
  confirmPasswordResetByPin,
  requestPasswordResetByEmail,
  verifyPasswordResetPin,
} from "./auth/password-reset-service";
import { sendSignupConfirmedEmail } from './auth/email-notification-service';

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

app.get('/auth/confirm-signup', async (c) => {
  const tokenHash = c.req.query('token_hash');
  const type = (c.req.query('type') || 'signup') as EmailOtpType;

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
        'Congrats, your email has been confirmed',
        'You can now login into the app using your credentials.'
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