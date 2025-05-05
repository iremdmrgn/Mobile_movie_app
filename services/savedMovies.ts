// services/savedMovies.ts
import { fetchCurrentUser } from "./appwriteFetch";

const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;
const BASE_URL = "https://cloud.appwrite.io/v1";

// 🎯 Film kaydet (kategori dahil)
export const saveMovie = async ({
  movieId,
  title,
  poster_path,
  category = "Favorites",
}: {
  movieId: number;
  title: string;
  poster_path: string;
  category?: string;
}) => {
  try {
    const user = await fetchCurrentUser();
    const response = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT_ID,
      },
      body: JSON.stringify({
        userId: user.$id,
        movie_id: movieId,
        title,
        poster_url: `https://image.tmdb.org/t/p/w500${poster_path}`,
        category,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message);
    }
  } catch (err) {
    console.error("saveMovie error:", err);
  }
};

// 🎯 Kaydı sil
export const unsaveMovie = async (movieId: number) => {
  try {
    const user = await fetchCurrentUser();
    const query = `queries[]=equal("userId","${user.$id}")&queries[]=equal("movie_id",${movieId})&queries[]=limit(1)`;
    const res = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${query}`, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    const data = await res.json();
    if (data.documents?.length > 0) {
      const docId = data.documents[0].$id;
      await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${docId}`, {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": PROJECT_ID,
        },
      });
    }
  } catch (err) {
    console.error("unsaveMovie error:", err);
  }
};

// 🎯 Kaydedilen filmleri al
export const getSavedMoviesByUser = async () => {
  try {
    const user = await fetchCurrentUser();
    const query = `queries[]=equal("userId","${user.$id}")&queries[]=limit(100)`;

    const res = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${query}`, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    const data = await res.json();

    const grouped: Record<string, any[]> = {};
    for (const doc of data.documents || []) {
      const category = doc.category || "Uncategorized";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(doc);
    }

    return grouped;
  } catch (err) {
    console.error("getSavedMoviesByUser error:", err);
    return {};
  }
};

// 🎯 Film zaten kayıtlı mı?
export const isMovieAlreadySaved = async (movieId: number) => {
  try {
    const user = await fetchCurrentUser();
    const query = `queries[]=equal("userId","${user.$id}")&queries[]=equal("movie_id",${movieId})&queries[]=limit(1)`;

    const res = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${query}`, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    const data = await res.json();
    return data.total > 0;
  } catch (err) {
    console.error("isMovieAlreadySaved error:", err);
    return false;
  }
};
