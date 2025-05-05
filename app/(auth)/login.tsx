import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  emailPasswordLogin,
  logoutCurrentUser,
} from "@/services/appwriteFetch";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    console.log("✅ Login ekranı yüklendi");
  }, []);

  const handleLogin = async () => {
    try {
      // Mevcut oturumu kapat (önlem)
      await logoutCurrentUser();

      // Giriş yap
      await emailPasswordLogin(email, password);

      // Ana sayfaya yönlendir
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login failed", error.message || "Unknown error");
    }
  };

  return (
    <View className="flex-1 bg-primary justify-center px-8">
      <Text className="text-white text-2xl font-bold mb-6">Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        className="bg-dark-200 text-white p-4 rounded mb-4"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        className="bg-dark-200 text-white p-4 rounded mb-6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleLogin}
        className="bg-secondary py-4 rounded"
      >
        <Text className="text-white text-center font-semibold">Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(auth)/register")}
        className="mt-4"
      >
        <Text className="text-gray-400 text-center">
          Don't have an account? <Text className="text-white">Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
