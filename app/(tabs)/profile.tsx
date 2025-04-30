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
import { icons } from "@/constants/icons";
import avatars from "@/constants/avatars";
import { account, databases, ID, Permission, Role } from "@/services/appwrite";
import { Query } from "react-native-appwrite";
import { useRouter } from "expo-router";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);

        const response = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal("userId", currentUser.$id)]
        );

        if (response.documents.length === 0) {
          const newProfile = await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            ID.unique(),
            {
              userId: currentUser.$id,
              username: currentUser.name || "",
              bio: "",
              avatarIndex: 0,
            },
            [
              Permission.read(Role.user(currentUser.$id)),
              Permission.write(Role.user(currentUser.$id)),
            ]
          );

          setProfile(newProfile);
          setDocumentId(newProfile.$id);
          setUsername(newProfile.username);
          setBio(newProfile.bio);
          setSelectedAvatarIndex(newProfile.avatarIndex);
        } else {
          const doc = response.documents[0];
          setProfile(doc);
          setDocumentId(doc.$id);
          setUsername(doc.username || "");
          setBio(doc.bio || "");
          setSelectedAvatarIndex(doc.avatarIndex ?? 0);
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    if (!documentId || selectedAvatarIndex === null) return;

    try {
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        documentId,
        { username, bio, avatarIndex: selectedAvatarIndex }
      );

      if (currentPassword) {
        if (newPassword) {
          await account.updatePassword(newPassword, currentPassword);
        }
        if (newEmail) {
          await account.updateEmail(newEmail, currentPassword);
        }
      }

      const updatedUser = await account.get();
      setUser(updatedUser);

      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewEmail("");

      Alert.alert("Success", "Profile updated");
    } catch (err: any) {
      Alert.alert("Update failed", err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/login");
    } catch (err: any) {
      Alert.alert("Logout failed", err.message);
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

            <TouchableOpacity
              onPress={handleSave}
              className="bg-secondary py-3 rounded-xl mb-3"
            >
              <Text className="text-white text-center font-semibold text-base">
                Save Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text className="text-gray-400 text-center text-sm underline">
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="space-y-2 px-1">
            <Text className="text-white text-2xl font-semibold">
              {profile?.username || "Unnamed"}
            </Text>
            <Text className="text-gray-400 text-sm">{user?.email}</Text>
            <Text className="text-gray-300 mt-3 leading-5">
              {profile?.bio || "No bio available."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
