import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { account } from "@/services/appwrite";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await account.createEmailSession(email, password);
      router.replace("/"); // tabs'e yönlendir
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary px-8 justify-center">
      <Text className="text-white text-2xl font-bold mb-6">Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        className="bg-dark-200 text-white p-4 rounded mb-4"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        className="bg-dark-200 text-white p-4 rounded mb-6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleLogin} className="bg-secondary py-4 rounded">
        <Text className="text-white text-center font-semibold">Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")} className="mt-4">
        <Text className="text-gray-400 text-center">
          Don't have an account? <Text className="text-white">Register</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
