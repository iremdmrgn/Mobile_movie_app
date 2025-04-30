import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { account } from "@/services/appwrite";
import * as SplashScreen from "expo-splash-screen";
import "./globals.css"; // Tailwind & NativeWind global stiller

// 🚫 Splash screen hemen kapanmasın
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (segments.length === 0) return;

      try {
        const user = await account.get();
        console.log("🟢 Girişli kullanıcı:", user);

        // Eğer email boşsa => anonim kullanıcıdır
        if (!user.email || user.email.trim() === "") {
          throw new Error("Anonim kullanıcı");
        }

        // Giriş yaptıysa ama auth ekranındaysa → ana sayfaya yönlendir
        const currentPath = `/${segments[0]?.join("/")}`;
        const authRoutes = ["/(auth)/login", "/(auth)/register"];
        if (authRoutes.includes(currentPath)) {
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.log("🔴 Girişsiz ya da anonim kullanıcı:", err);

        // Giriş yoksa ve auth dışında bir yerdeysek → login'e at
        const currentPath = `/${segments[0]?.join("/")}`;
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
