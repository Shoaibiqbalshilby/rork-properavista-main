import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Define the input schema for login
const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default publicProcedure
  .input(loginInputSchema)
  .mutation(async ({ input }) => {
    // In a real app, you would validate credentials against a database
    // For demo purposes, we'll just check if the email is demo@example.com
    
    if (input.email === 'demo@example.com' && input.password === 'password123') {
      return {
        success: true,
        user: {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
        }
      };
    }
    
    // If credentials don't match, throw an error
    throw new Error('Invalid email or password');
  });