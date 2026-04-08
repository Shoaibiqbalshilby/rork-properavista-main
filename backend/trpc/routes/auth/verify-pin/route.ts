import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { verifyPasswordResetPin } from "@/backend/auth/password-reset-service";

// Define the input schema for verifying PIN
const verifyPinSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(8, "PIN must be 8 digits"),
});

export default publicProcedure
  .input(verifyPinSchema)
  .mutation(async ({ input }) => verifyPasswordResetPin(input.email, input.pinCode));
