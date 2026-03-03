import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .query(async ({ ctx }) => {
    // In a real app, you would get the user from the context
    // which would be populated by an auth middleware
    
    // For demo purposes, we'll just return null
    return {
      user: null
    };
  });