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
  updateUserEmail,
  updateUserPassword,
  logoutCurrentUser,
} from "@/services/appwriteFetch";
import {
  DATABASE_ID,
  USERS_COLLECTION_ID,
  PROJECT_ID,
} from "@/services/appwrite";

type ProfileType = {
  username: string;
  bio: string;
  avatarIndex: number;
};

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Kullanıcı profilini al
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = await fetchCurrentUser();

        if (!currentUser) {
          // Giriş yapılmamış kullanıcıyı login sayfasına yönlendir
          Alert.alert("Error", "Please log in to access this page");
          router.replace("/(auth)/login");
          return;
        }

        setUser(currentUser);

        const response = await fetch(
          `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=equal("userId","${currentUser.$id}")`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Appwrite-Project": PROJECT_ID,
            },
          }
        );

        const data = await response.json();

        // Verinin mevcut olup olmadığını ve documents'ın bir dizi olduğunu kontrol et
        if (data && Array.isArray(data.documents) && data.documents.length > 0) {
          const doc = data.documents[0];
          setProfile(doc);
          setDocumentId(doc.$id);
          setUsername(doc.username || "");
          setBio(doc.bio || "");
          setSelectedAvatarIndex(doc.avatarIndex ?? 0);
        } else {
          // Eğer kullanıcı profil verisi yoksa, yeni bir profil oluştur
          const profileRes = await fetch(
            `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Appwrite-Project": PROJECT_ID,
              },
              body: JSON.stringify({
                userId: currentUser.$id,
                username: currentUser.name || "",
                bio: "",
                avatarIndex: 0,
              }),
            }
          );

          const newDoc = await profileRes.json();
          setProfile(newDoc);
          setDocumentId(newDoc.$id);
          setUsername(newDoc.username);
          setBio(newDoc.bio);
          setSelectedAvatarIndex(newDoc.avatarIndex);
        }
      } catch (err) {
        // Check if error is an instance of Error and handle it
        if (err instanceof Error) {
          console.error("Fetch profile error:", err);
          Alert.alert("Error", err.message || "An error occurred");
        } else {
          Alert.alert("Error", "An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []); // Component mount olduğunda çalışacak

  // Profil verisini kaydet
  const handleSave = async () => {
    if (!documentId || selectedAvatarIndex === null) return;

    try {
      // Profil verisini güncelle
      const response = await fetch(
        `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Appwrite-Project": PROJECT_ID,
          },
          body: JSON.stringify({ username, bio, avatarIndex: selectedAvatarIndex }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Şifre ve e-posta güncellemesi varsa, onları da güncelle
      if (currentPassword) {
        if (newPassword) await updateUserPassword(newPassword, currentPassword);
        if (newEmail) await updateUserEmail(newEmail, currentPassword);
      }

      // Güncellenmiş kullanıcı bilgilerini al
      const updatedUser = await fetchCurrentUser();
      setUser(updatedUser);

      // Profil düzenleme bitişi
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewEmail("");

      // Profil bilgilerini UI'da hemen güncelle
      setProfile((prevProfile) => ({
        ...prevProfile!,
        username,
        bio,
        avatarIndex: selectedAvatarIndex,
      }));

      // Profil güncellendiğinde kullanıcıya bilgi verme
      Alert.alert("Success", "Profile updated");
    } catch (err: any) {
      // Handle error with instance of Error check
      if (err instanceof Error) {
        Alert.alert("Update failed", err.message);
      } else {
        Alert.alert("Update failed", "An unknown error occurred");
      }
    }
  };

  // Kullanıcı çıkışı
  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Logout failed", err.message);
    }
  };

  // Yükleniyor durumu
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
            source={selectedAvatarIndex !== null ? avatars[selectedAvatarIndex] : icons.person}
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
                    className={`w-16 h-16 rounded-full ${selectedAvatarIndex === index ? "border-4 border-accent" : "opacity-60"}`}
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

            <Text className="text-white text-base font-semibold mb-2">Update Email</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              className="bg-dark-200 text-white px-4 py-3 rounded-xl mb-6"
              placeholder="New Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
            />

            <Text className="text-white text-base font-semibold mb-2">Change Password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              className="bg-dark-200 text-white px-4 py-3 rounded-xl mb-4"
              placeholder="Current Password"
              placeholderTextColor="#888"
              secureTextEntry
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              className="bg-dark-200 text-white px-4 py-3 rounded-xl mb-6"
              placeholder="New Password"
              placeholderTextColor="#888"
              secureTextEntry
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
            <Text className="text-white text-2xl font-semibold">{profile?.username || "Unnamed"}</Text>
            <Text className="text-gray-400 text-sm">{user?.email}</Text>
            <Text className="text-gray-300 mt-3 leading-5">{profile?.bio || "No bio available."}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
