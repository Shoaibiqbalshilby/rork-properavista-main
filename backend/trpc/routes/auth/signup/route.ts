import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { normalizeEmail } from '@/utils/password-reset';

const SIGNUP_REDIRECT_URL = 'https://properavista.com/login';

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
    },
  });
};

const shouldBypassEmailConfirmation = (message: string) => {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('email rate limit exceeded') ||
    normalized.includes('email address not authorized')
  );
};

// Define the input schema for signup
const signupInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

export default publicProcedure
  .input(signupInputSchema)
  .mutation(async ({ input }) => {
    try {
      const email = normalizeEmail(input.email);
      const metadata = {
        name: input.name,
        phone: input.phone,
        whatsapp: input.whatsapp,
      };

      const publicSupabase = createPublicSupabaseClient();
      const { data: authData, error: authError } = await publicSupabase.auth.signUp({
        email,
        password: input.password,
        options: {
          emailRedirectTo: SIGNUP_REDIRECT_URL,
          data: metadata,
        },
      });

      if (authError) {
        if (!shouldBypassEmailConfirmation(authError.message)) {
          throw new Error(authError.message);
        }

        const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: input.password,
          email_confirm: true,
          user_metadata: metadata,
        });

        if (adminError) {
          throw new Error(adminError.message);
        }

        if (!adminData.user) {
          throw new Error('User creation failed');
        }

        const { error: fallbackProfileError } = await supabaseAdmin
          .from("user_profiles")
          .upsert({
            id: adminData.user.id,
            email,
            name: input.name,
            phone: input.phone || null,
            whatsapp: input.whatsapp || null,
          }, {
            onConflict: 'id',
          });

        if (fallbackProfileError) {
          throw new Error("Failed to create user profile: " + fallbackProfileError.message);
        }

        return {
          success: true,
          requiresEmailConfirmation: false,
          redirectTo: SIGNUP_REDIRECT_URL,
          message: "Account created. Supabase email sending is unavailable right now, so your account has been activated and you can sign in immediately.",
        };
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .upsert({
          id: authData.user.id,
          email,
          name: input.name,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        throw new Error("Failed to create user profile: " + profileError.message);
      }

      return {
        success: true,
        requiresEmailConfirmation: true,
        redirectTo: SIGNUP_REDIRECT_URL,
        message: "Account created. Check your email and confirm it before signing in.",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Signup failed";
      throw new Error(message);
    }
  });