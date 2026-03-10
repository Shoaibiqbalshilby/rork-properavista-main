import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";

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
      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true, // Auto-confirm email (optional requirement)
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error("Failed to create user profile: " + profileError.message);
      }

      // Sign in the user automatically
      const { data: sessionData, error: signInError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

      if (signInError) {
        throw new Error("Auto-login failed: " + signInError.message);
      }

      return {
        success: true,
        message: "Account created successfully",
        user: {
          id: authData.user.id,
          email: input.email,
          name: input.name,
          phone: input.phone || "",
          whatsapp: input.whatsapp || "",
          avatar: "",
          companyName: "",
          description: "",
          address: "",
        },
        session: {
          accessToken: sessionData.session?.access_token,
          refreshToken: sessionData.session?.refresh_token,
          expiresIn: sessionData.session?.expires_in,
          expiresAt: sessionData.session?.expires_at,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Signup failed";
      throw new Error(message);
    }
  });