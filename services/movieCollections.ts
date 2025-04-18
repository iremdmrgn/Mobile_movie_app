import { ID, Query, Permission, Role } from "react-native-appwrite";
import { database, account } from "./appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!;

// ✅ Yeni koleksiyon oluşturma
export const createCollection = async (title: string) => {
  try {
    const user = await account.get();

    const payload = {
      userId: user.$id,
      title,
    };

    await database.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      payload,
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
      ]
    );
  } catch (error) {
    console.error("createCollection error:", error);
  }
};

// ✅ Kullanıcının koleksiyonlarını getir
export const getUserCollections = async () => {
  try {
    const user = await account.get();

    const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.limit(100),
    ]);

    return response.documents;
  } catch (error) {
    console.error("getUserCollections error:", error);
    return [];
  }
};

// ✅ Koleksiyonu silme
export const deleteCollection = async (collectionId: string) => {
  try {
    await database.deleteDocument(DATABASE_ID, COLLECTION_ID, collectionId);
  } catch (error) {
    console.error("deleteCollection error:", error);
  }
};

// ✅ Koleksiyon başlığını güncelleme
export const renameCollection = async (collectionId: string, newTitle: string) => {
  try {
    await database.updateDocument(DATABASE_ID, COLLECTION_ID, collectionId, {
      title: newTitle,
    });
  } catch (error) {
    console.error("renameCollection error:", error);
  }
};
