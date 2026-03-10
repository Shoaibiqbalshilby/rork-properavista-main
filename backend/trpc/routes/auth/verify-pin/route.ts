import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { validatePinFormat } from "@/utils/password-reset";

// Define the input schema for verifying PIN
const verifyPinSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(6, "PIN must be 6 digits"),
});

export default publicProcedure
  .input(verifyPinSchema)
  .mutation(async ({ input }) => {
    try {
      if (!validatePinFormat(input.pinCode)) {
        throw new Error("Invalid PIN format");
      }

      // Find user by email
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserByEmail(input.email);

      if (userError || !userData.user) {
        throw new Error("User not found");
      }

      // Find valid PIN
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from("password_reset_tokens")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("pin_code", input.pinCode)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        throw new Error("Invalid or expired PIN");
      }

      return {
        success: true,
        message: "PIN verified successfully",
        resetToken: tokenData.id,
        expiresAt: tokenData.expires_at,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PIN verification failed";
      throw new Error(message);
    }
  });
