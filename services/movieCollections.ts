// movieCollections.ts
import { Databases, Query, ID, Permission, Role } from "react-native-appwrite";
import { client, account } from "./appwrite";

const database = new Databases(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;

// 🎯 Yeni koleksiyon oluştur (film yok, sadece başlık belirle)
export const createCollection = async (title: string) => {
    const user = await account.get();
  
    const placeholderMovie = {
      movie_id: Math.floor(Math.random() * 1000000),
      title: "(placeholder)",
      poster_url: "https://placehold.co/600x400?text=Koleksiyon",
      category: title,
      userId: user.$id,
    };
  
    const response = await database.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      placeholderMovie.movie_id.toString(),
      placeholderMovie,
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
      ]
    );
  
    return response.$id;
  };
  

// 🎯 Belirli bir koleksiyonu sil (title üzerinden tüm belgeleri sil)
export const deleteCollectionByTitle = async (title: string) => {
  try {
    const user = await account.get();

    const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.equal("category", title),
    ]);

    for (const doc of response.documents) {
      await database.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
    }
  } catch (err) {
    console.error("deleteCollectionByTitle error:", err);
    throw err;
  }
};

// 🎯 Koleksiyon adını güncelleme (tüm ilgili belgelerin category alanını değiştir)
export const renameCollectionByTitle = async (oldTitle: string, newTitle: string) => {
  try {
    const user = await account.get();

    const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.equal("category", oldTitle),
    ]);

    for (const doc of response.documents) {
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        category: newTitle,
      });
    }
  } catch (error) {
    console.error("renameCollectionByTitle error:", error);
  }
};
