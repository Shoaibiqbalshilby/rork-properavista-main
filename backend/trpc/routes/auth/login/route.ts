import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";

// Define the input schema for login
const loginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default publicProcedure
  .input(loginInputSchema)
  .mutation(async ({ input }) => {
    try {
      // Sign in with Supabase
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Authentication failed");
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: profileData?.name || "",
          phone: profileData?.phone || "",
          whatsapp: profileData?.whatsapp || "",
          avatar: profileData?.avatar_url || "",
          companyName: profileData?.company_name || "",
          description: profileData?.description || "",
          address: profileData?.address || "",
        },
        session: {
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
          expiresIn: data.session?.expires_in,
          expiresAt: data.session?.expires_at,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed";
      throw new Error(message);
    }
  });