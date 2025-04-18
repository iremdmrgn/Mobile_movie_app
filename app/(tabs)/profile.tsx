import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";
import { account } from "@/services/appwrite"; // ← burası düzeltildi

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (err) {
        console.error("Appwrite user fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1 px-10">
      <View className="flex justify-center items-center flex-1 gap-5">
        <Image source={icons.person} className="size-10" tintColor="#fff" />
        <Text className="text-white text-xl font-semibold">
          {user?.name || "Unnamed"}
        </Text>
        <Text className="text-gray-400 text-base">{user?.email}</Text>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
