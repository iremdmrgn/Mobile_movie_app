// services/movieCollections.ts (REST API versiyonu)
import { fetchCurrentUser } from "./appwriteFetch";

const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;
const BASE_URL = "https://cloud.appwrite.io/v1";

// 🎯 Koleksiyon oluşturmak için placeholder doküman
export const createCollection = async (title: string) => {
  try {
    const user = await fetchCurrentUser();

    const payload = {
      userId: user.$id,
      movie_id: Math.floor(Math.random() * 1000000),
      title: "(placeholder)",
      poster_url: "https://placehold.co/600x400?text=Koleksiyon",
      category: title,
    };

    const response = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT_ID,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.$id;
  } catch (error) {
    console.error("createCollection error:", error);
  }
};

// 🎯 Koleksiyon sil (title'a göre tüm dokümanları sil)
export const deleteCollectionByTitle = async (title: string) => {
  try {
    const user = await fetchCurrentUser();
    const query = `queries[]=equal(\"userId\",\"${user.$id}\")&queries[]=equal(\"category\",\"${title}\")`;

    const res = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${query}`, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    const data = await res.json();
    for (const doc of data.documents || []) {
      await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${doc.$id}`, {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": PROJECT_ID,
        },
      });
    }
  } catch (err) {
    console.error("deleteCollectionByTitle error:", err);
  }
};

// 🎯 Koleksiyon yeniden adlandırma (title'ı güncelle)
export const renameCollectionByTitle = async (oldTitle: string, newTitle: string) => {
  try {
    const user = await fetchCurrentUser();
    const query = `queries[]=equal(\"userId\",\"${user.$id}\")&queries[]=equal(\"category\",\"${oldTitle}\")`;

    const res = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${query}`, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    const data = await res.json();
    for (const doc of data.documents || []) {
      await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${doc.$id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": PROJECT_ID,
        },
        body: JSON.stringify({ category: newTitle }),
      });
    }
  } catch (error) {
    console.error("renameCollectionByTitle error:", error);
  }
};
