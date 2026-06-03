import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

export const getApiBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  const normalizeBaseUrl = (rawUrl: string) => {
    let normalizedBaseUrl = rawUrl.replace(/\/$/, "");

    if (normalizedBaseUrl.startsWith('http://')) {
      const host = normalizedBaseUrl.replace(/^http:\/\//, '').split('/')[0]?.split(':')[0] || '';
      const isLocalHost =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

      if (!isLocalHost) {
        normalizedBaseUrl = normalizedBaseUrl.replace(/^http:\/\//, 'https://');
      }
    }

    if (normalizedBaseUrl.endsWith("/api/trpc")) {
      return normalizedBaseUrl.replace(/\/trpc$/, "");
    }

    if (normalizedBaseUrl.endsWith("/api")) {
      return normalizedBaseUrl;
    }

    return `${normalizedBaseUrl}/api`;
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
    return `http://${host}:8787/api`;
  }

  // For production/TestFlight: Return a placeholder that will error with a helpful message
  // Users must set EXPO_PUBLIC_API_BASE_URL environment variable before building
  if (process.env.NODE_ENV === 'production') {
    return "https://api.properavista.com/api";
  }

  // For development: Fallback so the module doesn't throw at load time
  // API-dependent features will show their own error messages instead of freezing on the splash.
  return "http://localhost:8787/api";
};

const getTrpcUrl = () => {
  const baseUrl = getApiBaseUrl();
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (normalizedBaseUrl.endsWith('/api')) {
    return `${normalizedBaseUrl}/trpc`;
  }

  if (normalizedBaseUrl.endsWith('/api/trpc')) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/api/trpc`;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getTrpcUrl(),
      transformer: superjson,
    }),
  ],
});