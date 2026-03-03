import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Define the input schema for signup
const signupInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export default publicProcedure
  .input(signupInputSchema)
  .mutation(async ({ input }) => {
    // In a real app, you would create a new user in the database
    // For demo purposes, we'll just return a success response
    
    // Check if email is already taken (demo@example.com is reserved)
    if (input.email === 'demo@example.com') {
      throw new Error('Email is already taken');
    }
    
    return {
      success: true,
      user: {
        id: Date.now().toString(),
        name: input.name,
        email: input.email,
      }
    };
  });