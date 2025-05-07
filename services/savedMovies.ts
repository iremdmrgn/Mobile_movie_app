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
    if (!user) throw new Error("Kullanıcı oturum açmamış.");

    const response = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT_ID,
      },
      body: JSON.stringify({
        documentId: "unique()",
        data: {
          userId: user.$id,
          movie_id: movieId,
          title,
          poster_url: `https://image.tmdb.org/t/p/w500${poster_path}`,
          category,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message);
    }

    return await response.json();
  } catch (err) {
    console.error("saveMovie error:", err);
    throw err;
  }
};

// 🎯 Kaydı sil
export const unsaveMovie = async (movieId: number) => {
  try {
    const user = await fetchCurrentUser();
    if (!user) throw new Error("Kullanıcı oturum açmamış.");

    const queries = [
      `equal("userId", "${user.$id}")`,
      `equal("movie_id", ${movieId})`,
    ];

    const queryParams = queries.map((q) => `queries[]=${encodeURIComponent(q)}`).join("&");
    const url = `${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${queryParams}&limit=1`;

    const res = await fetch(url, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    const data = await res.json();
    const doc = data.documents?.[0];
    if (doc) {
      const del = await fetch(`${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${doc.$id}`, {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": PROJECT_ID,
        },
      });

      if (!del.ok) {
        const err = await del.json();
        throw new Error(err.message);
      }
    }
  } catch (err) {
    console.error("unsaveMovie error:", err);
    throw err;
  }
};

export const getSavedMoviesByUser = async () => {
  try {
    const user = await fetchCurrentUser();
    if (!user) throw new Error("Kullanıcı oturum açmamış.");

    const url = `${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/search`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT_ID,
      },
      body: JSON.stringify({
        queries: [
          { method: "equal", attribute: "userId", values: [user.$id] }
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

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







export const isMovieAlreadySaved = async (movieId: number) => {
  try {
    const user = await fetchCurrentUser();
    if (!user) return false;

    const query = [
      JSON.stringify({ method: "equal", attribute: "userId", values: [user.$id] }),
      JSON.stringify({ method: "equal", attribute: "movie_id", values: [movieId] }),
      JSON.stringify({ method: "limit", values: [1] }),
    ];

    const params = query.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");

    const url = `${BASE_URL}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${params}`;

    console.log("✅ Final Appwrite URL:", url);

    const res = await fetch(url, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("❌ Appwrite error:", err);
      throw new Error(err.message);
    }

    const data = await res.json();
    return data.total > 0;
  } catch (err) {
    console.error("isMovieAlreadySaved error:", err);
    return false;
  }
};





