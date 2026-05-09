import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { requestSignupVerification } from "@/backend/auth/signup-verification-service";

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
  .mutation(async ({ input }) =>
    requestSignupVerification(
      input.name,
      input.email,
      input.password,
      input.phone,
      input.whatsapp,
    )
  );