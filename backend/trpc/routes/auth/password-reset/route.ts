import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabaseAdmin } from "@/lib/supabase";
import {
  generatePinCode,
  sendPinToEmail,
  sendPinToSms,
  validatePhoneNumber,
  formatPhoneNumber,
} from "@/utils/password-reset";

// Define the input schema for password reset request
const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Invalid phone number"),
});

export default publicProcedure
  .input(resetRequestSchema)
  .mutation(async ({ input }) => {
    try {
      // Validate phone number format
      if (!validatePhoneNumber(input.phoneNumber)) {
        throw new Error(
          "Invalid phone number format. Use format like 08012345678 or +2348012345678"
        );
      }

      // Find user by email
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserByEmail(input.email);

      if (userError || !userData.user) {
        // Don't reveal if email exists (security)
        return {
          success: true,
          message: "If the email exists, a PIN has been sent",
        };
      }

      // Check if phone number matches user profile
      const { data: profileData } = await supabaseAdmin
        .from("user_profiles")
        .select("phone")
        .eq("id", userData.user.id)
        .single();

      const userPhone = profileData?.phone
        ? formatPhoneNumber(profileData.phone)
        : null;
      const requestedPhone = formatPhoneNumber(input.phoneNumber);

      if (userPhone !== requestedPhone) {
        // Don't reveal phone mismatch (security)
        return {
          success: true,
          message: "If the email exists and phone matches, a PIN has been sent",
        };
      }

      // Generate PIN
      const pinCode = generatePinCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // PIN expires in 15 minutes

      // Store PIN in database
      const { error: pinError } = await supabaseAdmin
        .from("password_reset_tokens")
        .insert({
          user_id: userData.user.id,
          pin_code: pinCode,
          phone_number: requestedPhone,
          expires_at: expiresAt.toISOString(),
        });

      if (pinError) {
        throw new Error("Failed to generate reset PIN");
      }

      // Send PIN via SMS
      const smsSent = await sendPinToSms(requestedPhone, pinCode);

      // Also send via email as backup
      const emailSent = await sendPinToEmail(input.email, pinCode);

      if (!smsSent && !emailSent) {
        throw new Error("Failed to send PIN. Please try again.");
      }

      return {
        success: true,
        message: "PIN sent to your registered phone number and email",
        channel: smsSent ? "sms" : "email",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to process password reset request";
      throw new Error(message);
    }
  });
