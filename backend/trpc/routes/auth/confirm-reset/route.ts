import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";

// Define the input schema for confirming password reset
const confirmResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(6, "PIN must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default publicProcedure
  .input(confirmResetSchema)
  .mutation(async ({ input }) => {
    try {
      // Find user by email
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserByEmail(input.email);

      if (userError || !userData.user) {
        throw new Error("User not found");
      }

      // Find and validate PIN
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

      // Update user password
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
          password: input.newPassword,
        });

      if (updateError) {
        throw new Error("Failed to reset password: " + updateError.message);
      }

      // Mark PIN as used
      const { error: markUsedError } = await supabaseAdmin
        .from("password_reset_tokens")
        .update({ is_used: true })
        .eq("id", tokenData.id);

      if (markUsedError) {
        console.error("Failed to mark PIN as used:", markUsedError);
      }

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Password reset failed";
      throw new Error(message);
    }
  });
