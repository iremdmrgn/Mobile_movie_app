import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { icons } from "@/constants/icons";
import avatars from "@/constants/avatars";

import {
  fetchCurrentUser,
  logoutCurrentUser,
} from "@/services/appwriteFetch";

import {
  DATABASE_ID,
  USERS_COLLECTION_ID,
  PROJECT_ID,
} from "@/services/appwrite";

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        console.log("🟢 Girişli kullanıcı:", currentUser);

        if (!currentUser) {
          Alert.alert("Error", "Please log in to access this page");
          router.replace("/(auth)/login");
          return;
        }

        setUser(currentUser);

        const response = await fetch(
          `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(`equal("userId","${currentUser.$id}")`)}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Appwrite-Project": PROJECT_ID,
            },
          }
        );

        const data = await response.json();
        console.log("📄 Profil sorgu sonucu:", data);

        if (data?.documents?.length > 0) {
          const doc = data.documents[0];
          setDocumentId(doc.$id);
          setUsername(doc.username || "");
          setBio(doc.bio || "");
          setSelectedAvatarIndex(doc.avatarIndex ?? 0);
        } else {
          const createRes = await fetch(
            `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Appwrite-Project": PROJECT_ID,
              },
              body: JSON.stringify({
                documentId: "unique()",
                data: {
                  userId: currentUser.$id,
                  username: currentUser.name || "",
                  bio: "",
                  avatarIndex: 0,
                  avatarUrl: `avatar-0`,
                },
              }),
            }
          );

          const newDoc = await createRes.json();
          console.log("🌟 Yeni profil oluşturuldu:", newDoc);

          setDocumentId(newDoc.$id);
          setUsername(newDoc.username);
          setBio(newDoc.bio);
          setSelectedAvatarIndex(newDoc.avatarIndex);
        }
      } catch (err) {
        console.error("🚨 Profil getirme hatası:", err);
        Alert.alert("Error", "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    console.log("🧾 Gönderilen documentId:", documentId);
  
    if (!documentId) {
      Alert.alert("Hata", "Kullanıcı profili bulunamadı");
      return;
    }
  
    try {
      const payload = {
        documentId,
        username,
        bio,
        avatarIndex: selectedAvatarIndex,
      };
  
      const response = await fetch(
        "https://cloud.appwrite.io/v1/functions/6822f6b5003be3bf6c9a/executions",
        {
          method: "POST",
          headers: {
            "X-Appwrite-Project": PROJECT_ID,
            "Content-Type": "application/json",
            "X-Appwrite-Data": JSON.stringify(payload), // ✨ EN ÖNEMLİ SATIR
          },
        }
      );
  
      const result = await response.json();
      console.log("🔥 Function full result:", result);
  
      let parsed;
      try {
        parsed =
          typeof result.response === "string"
            ? JSON.parse(result.response)
            : result.response;
  
        console.log("🌈 Function parsed result:", parsed);
      } catch (e) {
        console.error("❌ JSON parse hatası:", e);
      }
  
      if (parsed?.success) {
        Alert.alert("Başarılı", "Profil güncellendi 🎉");
        setIsEditing(false);
      } else {
        console.error("🔴 Güncelleme hatası (parsed):", parsed);
        Alert.alert("Hata", parsed?.error || "Profil güncellenemedi");
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("🔴 Function çağrısı hatası:", err.message);
        Alert.alert("Hata", err.message);
      } else {
        console.error("🔴 Function bilinmeyen hata:", JSON.stringify(err));
        Alert.alert("Hata", "Bilinmeyen bir hata oluştu");
      }
    }
  };
  

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
      router.replace("/(auth)/login");
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert("Logout failed", err.message);
      } else {
        Alert.alert("Logout failed", "Bilinmeyen bir hata oluştu");
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1">
      <View className="flex-row justify-between items-center px-6 py-4">
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text className="text-accent font-semibold text-base">Edit Profile</Text>
          </TouchableOpacity>
        )}
        {!isEditing && (
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-red-400 font-semibold text-base">Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="items-center mt-6 mb-6">
          <Image
            source={avatars[selectedAvatarIndex] || icons.person}
            className="w-28 h-28 rounded-full bg-dark-200"
            resizeMode="cover"
          />
        </View>

        {isEditing ? (
          <>
            <View className="flex-row flex-wrap justify-center mb-4 gap-3">
              {avatars.map((img, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedAvatarIndex(index)}>
                  <Image
                    source={img}
                    className={`w-16 h-16 rounded-full ${
                      selectedAvatarIndex === index ? "border-4 border-accent" : "opacity-60"
                    }`}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={username}
              onChangeText={setUsername}
              className="bg-dark-200 text-white px-4 py-3 rounded-xl mb-4"
              placeholder="Username"
              placeholderTextColor="#888"
            />

            <TextInput
              value={bio}
              onChangeText={setBio}
              className="bg-dark-200 text-white px-4 py-3 rounded-xl mb-6"
              placeholder="Bio"
              placeholderTextColor="#888"
              multiline
            />

            <TouchableOpacity onPress={handleSave} className="bg-secondary py-3 rounded-xl mb-3">
              <Text className="text-white text-center font-semibold text-base">Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text className="text-gray-400 text-center text-sm underline">Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="space-y-2 px-1">
            <Text className="text-white text-2xl font-semibold">{username || "Unnamed"}</Text>
            <Text className="text-gray-400 text-sm">{user?.email}</Text>
            <Text className="text-gray-300 mt-3 leading-5">{bio || "No bio available."}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
