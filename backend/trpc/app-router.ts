import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import loginRoute from "./routes/auth/login/route";
import signupRoute from "./routes/auth/signup/route";
import meRoute from "./routes/auth/me/route";
import passwordResetRoute from "./routes/auth/password-reset/route";
import verifyPinRoute from "./routes/auth/verify-pin/route";
import confirmResetRoute from "./routes/auth/confirm-reset/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    login: loginRoute,
    signup: signupRoute,
    me: meRoute,
    passwordReset: passwordResetRoute,
    verifyPin: verifyPinRoute,
    confirmReset: confirmResetRoute,
  }),
});

export type AppRouter = typeof appRouter;