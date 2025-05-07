import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { fetchCurrentUser } from "@/services/appwriteFetch";
import "./globals.css";

// Splash ekranı açık tut
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (segments.length === 0) return;

      try {
        const user = await fetchCurrentUser();
        console.log("🟢 Girişli kullanıcı:", user);

        if (!user?.email || user.email.trim() === "") {
          throw new Error("Anonim kullanıcı");
        }

        const currentPath = Array.isArray(segments[0])
          ? `/${segments[0].join("/")}`
          : "/";
        const authRoutes = ["/(auth)/login", "/(auth)/register"];
        if (authRoutes.includes(currentPath)) {
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.log("🔴 Girişsiz ya da anonim kullanıcı:", err);

        const currentPath = Array.isArray(segments[0])
          ? `/${segments[0].join("/")}`
          : "/";
        const allowed = ["/(auth)/login", "/(auth)/register"];
        if (!allowed.includes(currentPath)) {
          router.replace("/(auth)/login");
        }
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    checkAuth();
  }, [segments]);

  if (!appReady) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <Text className="text-white mb-3">Uygulama hazırlanıyor...</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <Slot />;
}
