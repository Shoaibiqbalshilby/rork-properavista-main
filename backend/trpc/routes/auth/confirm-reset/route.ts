import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { confirmPasswordResetByPin } from "@/backend/auth/password-reset-service";

// Define the input schema for confirming password reset
const confirmResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(8, "PIN must be 8 digits"),
  resetToken: z.string().uuid().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default publicProcedure
  .input(confirmResetSchema)
  .mutation(async ({ input }) =>
    confirmPasswordResetByPin(input.email, input.pinCode, input.newPassword, input.resetToken)
  );
