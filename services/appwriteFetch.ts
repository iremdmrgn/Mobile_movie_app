import {
  PROJECT_ID as APPWRITE_PROJECT,
  DATABASE_ID,
  MOVIES_COLLECTION_ID,
} from "./appwrite";

import { fetchMovieDetails } from "./tmdb";

// Email/password ile kullanıcı kaydı
export const emailPasswordRegister = async (email: string, password: string, name: string) => {
  const response = await fetch("https://cloud.appwrite.io/v1/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT,
    },
    body: JSON.stringify({
      userId: "unique()",
      email,
      password,
      name,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return await response.json();
};

// Giriş
export const emailPasswordLogin = async (email: string, password: string) => {
  const response = await fetch("https://cloud.appwrite.io/v1/account/sessions/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  return await response.json();
};

// Oturum kontrolü
export const fetchCurrentUser = async (): Promise<any | null> => {
  try {
    const response = await fetch("https://cloud.appwrite.io/v1/account", {
      method: "GET",
      headers: {
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });

    if (!response.ok) return null;
    const user = await response.json();
    if (!user || !user.email || typeof user.email !== "string") return null;
    return user;
  } catch {
    return null;
  }
};

// Oturum kapatma
export const logoutCurrentUser = async (): Promise<void> => {
  try {
    await fetch("https://cloud.appwrite.io/v1/account/sessions/current", {
      method: "DELETE",
      headers: {
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

// E-posta güncelle
export const updateUserEmail = async (newEmail: string, password: string) => {
  const response = await fetch("https://cloud.appwrite.io/v1/account/email", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT,
    },
    body: JSON.stringify({ email: newEmail, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Email update failed");
  }

  return await response.json();
};

// Şifre güncelle
export const updateUserPassword = async (newPassword: string, oldPassword: string) => {
  const response = await fetch("https://cloud.appwrite.io/v1/account/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT,
    },
    body: JSON.stringify({ password: newPassword, oldPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Password update failed");
  }

  return await response.json();
};

// Film araması
export const fetchMovies = async ({ query = "" }: { query?: string }) => {
  const endpoint = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;
  let url = endpoint;

  if (query.trim() !== "") {
    const encodedQuery = encodeURIComponent(`search("title","${query.trim()}")`);
    url = `${endpoint}?queries[]=${encodedQuery}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("fetchMovies hatası:", error);
      throw new Error("Filmler alınamadı");
    }

    const data = await response.json();
    return data.documents;
  } catch (error) {
    console.error("fetchMovies hatası:", error);
    throw new Error("Filmler alınamadı");
  }
};

// Film daha önce eklenmiş mi kontrol et (manuel eşleşme)
export const isMovieAlreadySaved = async (movieId: number): Promise<any | null> => {
  const numericId = Number(movieId);
  if (isNaN(numericId)) return null;

  const url = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });

    const data = await response.json();
    const found = data.documents.find((doc: any) => Number(doc.movie_id) === numericId);

    return found || null;
  } catch (error) {
    console.error("isMovieAlreadySaved (fallback) hatası:", error);
    return null;
  }
};

export const getTrendingMovies = async (): Promise<any[]> => {
  const endpoint = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("getTrendingMovies hatası:", error);
      return [];
    }

    const data = await response.json();

    // Duplicate'leri kaldır (en son eklenen versiyonu kalsın)
    const seen = new Set();
    const uniqueDocs = data.documents
      .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      .filter((doc: any) => {
        const id = doc.movie_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    const limited = uniqueDocs.slice(0, 10); // sadece ilk 10 farklı film

    const movieResponses = await Promise.all(
      limited.map((doc: any) => fetchMovieDetails(doc.movie_id))
    );

    return movieResponses.filter((m) => m && typeof m.id === "number");
  } catch (error) {
    console.error("getTrendingMovies hatası:", error);
    return [];
  }
};




// Arama yapıldığında sayaç artır veya kayıt oluştur
export const updateSearchCount = async (query: string, movie: { id: number; title: string; poster_path?: string }) => {
  try {
    const movieId = Number(movie.id);
    console.log("🎬 [updateSearchCount] movie.id:", movie.id, typeof movie.id, "→", movieId);
    if (isNaN(movieId)) return;
    const existing = await isMovieAlreadySaved(movieId);
    const baseUrl = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

    if (existing) {
      const res = await fetch(`${baseUrl}/${existing.$id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT,
        },
        body: JSON.stringify({
          data: {
            count: (existing.count || 0) + 1,
          },
        }),
      });

      const json = await res.json();
      console.log("✅ count güncellendi:", json);
    } else {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT,
        },
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            movie_id: movieId,
            title: movie.title,
            searchTerm: query,
            poster_url: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null,
            count: 1,
          },
        }),
      });

      const json = await res.json();
      console.log("✅ Yeni film eklendi:", json);
    }
  } catch (error) {
    console.error("updateSearchCount hatası:", error);
  }
};
