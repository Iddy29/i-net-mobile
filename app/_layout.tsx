import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check if the user is on an auth screen (welcome, register, login, otp-verify)
    const inAuthGroup =
      segments[0] === "index" ||
      segments[0] === "register" ||
      segments[0] === "login" ||
      segments[0] === "otp-verify" ||
      segments.length === 0;

    // Protected standalone screens - don't treat as auth group
    const inProtectedNonTab =
      segments[0] === "profile-edit" ||
      segments[0] === "transactions" ||
      segments[0] === "notifications";

    if (isAuthenticated && inAuthGroup) {
      // Authenticated user trying to access auth screens -> redirect to dashboard
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !inAuthGroup && !inProtectedNonTab) {
      // Unauthenticated user trying to access protected screens -> redirect to welcome
      router.replace("/");
    } else if (!isAuthenticated && inProtectedNonTab) {
      // Unauthenticated user on a protected non-tab screen -> redirect to welcome
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "transparent" },
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp-verify" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="transactions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
