import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { verifySignupVerification } from "@/backend/auth/signup-verification-service";

// Define the input schema for verifying PIN
const verifyPinSchema = z.object({
  email: z.string().email("Invalid email address"),
  pinCode: z.string().length(8, "PIN must be 8 digits"),
});

export default publicProcedure
  .input(verifyPinSchema)
  .mutation(async ({ input }) => verifySignupVerification(input.email, input.pinCode));
