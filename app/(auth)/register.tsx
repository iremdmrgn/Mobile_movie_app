import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { account, databases, ID } from "@/services/appwrite";
import { useRouter } from "expo-router";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const createdUser = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
  
      // Profil belgesi oluştur
      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: createdUser.$id,
          username: name,
          bio: "Hi! I'm using the app.",
          avatarUrl: "",
        }
      );
  
      // Kullanıcıya seçim sun
      Alert.alert(
        "Registration Successful",
        "Your account has been created. Do you want to sign in now?",
        [
          {
            text: "Yes, Sign In",
            onPress: () => router.replace("/(auth)/login"),
          },
          {
            text: "No, Later",
            style: "cancel",
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    }
  };
  

  return (
    <SafeAreaView className="flex-1 bg-primary px-8 justify-center">
      <Text className="text-white text-2xl font-bold mb-6">Register</Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="#aaa"
        className="bg-dark-200 text-white p-4 rounded mb-4"
        value={name}
        onChangeText={setName}
      />

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

      <TouchableOpacity
        onPress={handleRegister}
        className="bg-secondary py-4 rounded"
      >
        <Text className="text-white text-center font-semibold">Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(auth)/login")}
        className="mt-4"
      >
        <Text className="text-gray-400 text-center">
          Already have an account?{" "}
          <Text className="text-white">Login</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
