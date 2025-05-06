import {
  PROJECT_ID as APPWRITE_PROJECT,
  DATABASE_ID,
  MOVIES_COLLECTION_ID,
} from "./appwrite";

import { fetchMovieDetails } from "./tmdb";

// ✅ Email/password ile kullanıcı kaydı
export const emailPasswordRegister = async (email, password, name) => {
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

// ✅ Giriş
export const emailPasswordLogin = async (email, password) => {
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

// ✅ Oturum kontrolü
export const fetchCurrentUser = async () => {
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

// ✅ Oturum kapatma
export const logoutCurrentUser = async () => {
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

// ✅ E-posta güncelle
export const updateUserEmail = async (newEmail, password) => {
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

// ✅ Şifre güncelle
export const updateUserPassword = async (newPassword, oldPassword) => {
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

// ✅ Film araması (Appwrite DB)
export const fetchMovies = async ({ query = "" }) => {
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

// ✅ Aynı film daha önce eklenmiş mi kontrol et (integer eşleşme!)
export const isMovieAlreadySaved = async (movieId) => {
  const query = `equal("movie_id", ${movieId})`; // integer olarak gönder
  const url = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
    });

    const data = await response.json();
    return data.documents?.[0] || null;
  } catch (error) {
    console.error("isMovieAlreadySaved hatası:", error);
    return null;
  }
};

// ✅ Trend filmleri getir
export const getTrendingMovies = async () => {
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

    const sorted = data.documents
      .filter((doc) => typeof doc.count === "number")
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const movies = await Promise.all(
      sorted.map((doc) => fetchMovieDetails(doc.movie_id))
    );

    return movies;
  } catch (error) {
    console.error("getTrendingMovies hatası:", error);
    return [];
  }
};

export const updateSearchCount = async (query, movie) => {
  try {
    const existing = await isMovieAlreadySaved(movie.id);
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
            count: (existing.count || 0) + 1, // ✅ tekrar "data" içine alıyoruz
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
            movie_id: movie.id,
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

