import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StatusBar } from "react-native";
import { account } from "@/services/appwrite";
import "./globals.css"; // tailwind & nativewind için global stil dosyası

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await account.get();
        console.log("🟢 Girişli kullanıcı:", user);

        if (segments[0] === "(auth)") {
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.log("🔴 Girişsiz kullanıcı:", err);

        if (segments[0] !== "(auth)") {
          router.replace("/(auth)/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#161622",
        }}
      >
        <Text style={{ color: "#fff", marginBottom: 10 }}>
          Checking login status...
        </Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden />
      <Slot />
    </>
  );
}
