import {
  PROJECT_ID as APPWRITE_PROJECT,
  DATABASE_ID,
  MOVIES_COLLECTION_ID,
} from "./appwrite";

import { fetchMovieDetails } from "./tmdb";
import * as SecureStore from "expo-secure-store";

// JWT alma
export const getJWT = async (): Promise<string | null> => {
  try {
    const response = await fetch("https://cloud.appwrite.io/v1/account/jwt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("JWT alma hatası:", error);
      return null;
    }

    const data = await response.json();
    return data.jwt;
  } catch (err) {
    console.error("getJWT error:", err);
    return null;
  }
};

// 🔄 JWT SecureStore'dan alınır
export const fetchCurrentUser = async (): Promise<any | null> => {
  try {
    const jwt = await SecureStore.getItemAsync("appwrite_jwt");
    if (!jwt) {
      console.warn("🔒 JWT bulunamadı, kullanıcı anonim olabilir.");
      return null;
    }

    const res = await fetch("https://cloud.appwrite.io/v1/account", {
      method: "GET",
      headers: {
        "X-Appwrite-Project": APPWRITE_PROJECT,
        "Authorization": `Bearer ${jwt}`,
      },
    });

    if (!res.ok) {
      console.warn("🔴 Giriş başarısız:", await res.text());
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("🔴 fetchCurrentUser error:", err);
    return null;
  }
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

// Kayıt
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

// E-posta güncelleme
export const updateUserEmail = async (jwt: string, newEmail: string, password: string) => {
  const response = await fetch("https://cloud.appwrite.io/v1/account/email", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT,
      "Authorization": `Bearer ${jwt}`,
    },
    body: JSON.stringify({ email: newEmail, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Email update failed");
  }

  return await response.json();
};

// Şifre güncelleme
export const updateUserPassword = async (jwt: string, newPassword: string, oldPassword: string) => {
  const response = await fetch("https://cloud.appwrite.io/v1/account/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT,
      "Authorization": `Bearer ${jwt}`,
    },
    body: JSON.stringify({ password: newPassword, oldPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Password update failed");
  }

  return await response.json();
};

// Oturum kontrolü
export const checkUserLoggedIn = async (jwt: string) => {
  try {
    const res = await fetch("https://cloud.appwrite.io/v1/account", {
      method: "GET",
      headers: {
        "X-Appwrite-Project": APPWRITE_PROJECT,
        "Authorization": `Bearer ${jwt}`,
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

// Trending movies
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

    const uniqueMap = new Map<number | string, any>();
    for (const doc of data.documents) {
      if (doc.movie_id && !uniqueMap.has(doc.movie_id)) {
        uniqueMap.set(doc.movie_id, doc);
      }
    }

    const uniqueDocs = Array.from(uniqueMap.values());

    const sorted = uniqueDocs
      .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      .slice(0, 10);

    const movieResponses = await Promise.all(
      sorted.map((doc: any) => fetchMovieDetails(doc.movie_id))
    );

    return movieResponses.filter((m) => m && typeof m.id === "number");
  } catch (error) {
    console.error("getTrendingMovies hatası:", error);
    return [];
  }
};

// Arama yapılan filmi sayaca göre güncelle
export const updateSearchCount = async (query: string, movie: { id: number; title: string; poster_path?: string }) => {
  try {
    const movieId = Number(movie.id);
    if (isNaN(movieId)) return;

    const response = await fetch(
      `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(
        JSON.stringify({ equal: ["movie_id", movieId] })
      )}&queries[]=${encodeURIComponent(`equal("movie_id", ${movieId})`)}
`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT,
        },
      }
    );

    const data = await response.json();
    const existing = data.documents?.[0];

    const baseUrl = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

    if (existing) {
      await fetch(`${baseUrl}/${existing.$id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT,
        },
        body: JSON.stringify({
          data: { count: (existing.count || 0) + 1 },
        }),
      });
    } else {
      await fetch(baseUrl, {
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
            poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            count: 1,
          },
        }),
      });
    }
  } catch (error) {
    console.error("updateSearchCount hatası:", error);
  }
};
