import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";

export default publicProcedure
  .query(async ({ ctx }) => {
    try {
      // Get user from request headers (authorization token)
      const authHeader = ctx.req.headers.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { user: null };
      }

      // Extract token from Bearer header
      const token = authHeader.substring(7);

      // Verify token and get user
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return { user: null };
      }

      // Fetch user profile
      const { data: profileData } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      return {
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
      };
    } catch (error) {
      console.error("Error fetching current user:", error);
      return { user: null };
    }
  });