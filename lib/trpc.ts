import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getTrpcUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  const normalizeBaseUrl = (rawUrl: string) => {
    const normalizedBaseUrl = rawUrl.replace(/\/$/, "");

    if (normalizedBaseUrl.endsWith("/api/trpc")) {
      return normalizedBaseUrl;
    }

    if (normalizedBaseUrl.endsWith("/api")) {
      return `${normalizedBaseUrl}/trpc`;
    }

    return `${normalizedBaseUrl}/api/trpc`;
  };

  if (baseUrl) {
    return normalizeBaseUrl(baseUrl);
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8081/api/trpc`;
  }

  // Fallback so the module doesn't throw at load time on a built APK.
  // API-dependent features will show their own error messages instead of freezing on the splash.
  return "http://localhost:8081/api/trpc";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getTrpcUrl(),
      transformer: superjson,
    }),
  ],
});