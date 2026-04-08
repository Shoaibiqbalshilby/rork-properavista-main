import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { requestPasswordResetByEmail } from "@/backend/auth/password-reset-service";

// Define the input schema for password reset request
const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default publicProcedure
  .input(resetRequestSchema)
  .mutation(async ({ input }) => requestPasswordResetByEmail(input.email));
