import {
  PROJECT_ID as APPWRITE_PROJECT,
  DATABASE_ID,
  MOVIES_COLLECTION_ID,
} from "./appwrite";

// ✅ Email/password ile kullanıcı kaydı
export const emailPasswordRegister = async (
  email: string,
  password: string,
  name: string
) => {
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

// ✅ Giriş (oturum açma)
export const emailPasswordLogin = async (email: string, password: string) => {
  const response = await fetch(
    "https://cloud.appwrite.io/v1/account/sessions/email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
      body: JSON.stringify({ email, password }),
    }
  );

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

// ✅ Şifre güncelle
export const updateUserPassword = async (
  newPassword: string,
  oldPassword: string
) => {
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

// ✅ Tüm filmleri getir (Appwrite içindeki)
export const fetchMovies = async ({ query = "" }: { query?: string }) => {
  const searchParam = query.trim();
  const searchQuery = searchParam
    ? `queries[]=search(title,"${searchParam}")`
    : "";

  const endpoint = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

  try {
    const response = await fetch(
      `${endpoint}${searchQuery ? `?${searchQuery}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT,
        },
      }
    );

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

// ✅ Trend filmleri getir (searchCount'e göre azalan sıralı)
export const getTrendingMovies = async () => {
  const endpoint = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

  const query = [
    "queries[]=orderDesc(searchCount)", // ✅ Düzeltildi
    "queries[]=limit(10)"
  ].join("&");

  try {
    const response = await fetch(`${endpoint}?${query}`, {
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
    return data.documents;
  } catch (error) {
    console.error("getTrendingMovies hatası:", error);
    return [];
  }
};

// ✅ Aranan film için arama sayısını 1 artır
export const updateSearchCount = async (query: string, movie: any) => {
  const documentId = movie?.$id;
  const currentCount = movie?.searchCount || 0;

  if (!documentId) return;

  const endpoint = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents/${documentId}`;

  try {
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
      body: JSON.stringify({
        searchCount: currentCount + 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Arama sayısı güncellenemedi:", error);
    }
  } catch (error) {
    console.error("Arama sayısı güncellenemedi:", error);
  }
};
