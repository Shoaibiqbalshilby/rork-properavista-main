import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Alert, BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import EulaModal from "@/components/EulaModal";

const EULA_ACCEPTED_KEY = "eula_accepted_v1";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// React Query client
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
  });
  const [eulaAccepted, setEulaAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(EULA_ACCEPTED_KEY).then((value) => {
      setEulaAccepted(value === "true");
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Don't render until EULA status is known
  if (eulaAccepted === null) {
    return null;
  }

  const handleEulaAccept = async () => {
    await AsyncStorage.setItem(EULA_ACCEPTED_KEY, "true");
    setEulaAccepted(true);
  };

  const handleEulaDecline = () => {
    Alert.alert(
      "Agreement Required",
      "You must accept the End User License Agreement to use Properavista.",
      [
        {
          text: "Review Again",
          style: "cancel",
        },
        {
          text: "Exit App",
          style: "destructive",
          onPress: () => BackHandler.exitApp(),
        },
      ]
    );
  };

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <EulaModal
          visible={!eulaAccepted}
          onAccept={handleEulaAccept}
          onDecline={handleEulaDecline}
        />
        <RootLayoutNav />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen name="business-profile" options={{ title: "Business Profile" }} />
      <Stack.Screen name="add-property" options={{ title: "Add Property" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy & Security" }} />
      <Stack.Screen name="help" options={{ title: "Help & Support" }} />
      <Stack.Screen name="messages" options={{ title: "Messages" }} />
      <Stack.Screen name="my-properties" options={{ title: "My Properties" }} />
      <Stack.Screen name="property/[id]" options={{ title: "Property" }} />
    </Stack>
  );
}














// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useEffect } from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { trpc, trpcClient } from "@/lib/trpc";


// export const unstable_settings = {
//   // Ensure that reloading on `/modal` keeps a back button present.
//   initialRouteName: "(tabs)",
// };

// // Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

// // Create a client
// const queryClient = new QueryClient();

// export default function RootLayout() {
//   const [loaded, error] = useFonts({
//     ...FontAwesome.font,
//   });

//   useEffect(() => {
//     if (error) {
//       console.error(error);
//       throw error;
//     }
//   }, [error]);

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <trpc.Provider client={trpcClient} queryClient={queryClient}>
//       <QueryClientProvider client={queryClient}>
//         <RootLayoutNav />
//       </QueryClientProvider>
//     </trpc.Provider>
//   );
// }

// function RootLayoutNav() {
//   return (
//     <Stack
//       screenOptions={{
//         headerBackTitle: "Back",
//       }}
//     >
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//       <Stack.Screen name="modal" options={{ presentation: "modal" }} />
//       <Stack.Screen name="login" options={{ title: "Sign In" }} />
//       <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
//       <Stack.Screen name="add-property" options={{ title: "Add Property" }} />
//       <Stack.Screen name="property/[id]" options={{ title: "Property" }} />
//     </Stack>
//   );
// }