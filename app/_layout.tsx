import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { account } from "@/services/appwrite";
import { StatusBar } from "react-native";
import "./globals.css";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await account.get();

        // Kullanıcı login olmuşsa ve (auth)'taysa → anasayfaya at
        if (segments[0] === "(auth)") {
          router.replace("/");
        }
      } catch {
        // Giriş yapılmamışsa ve (tabs)'taysa → login'e yönlendir
        if (segments[0] !== "(auth)") {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [segments]);

  if (loading) return null;

  return (
    <>
      <StatusBar hidden={true} />

      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movies/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
