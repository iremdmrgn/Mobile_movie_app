// JWT ile çalışan Appwrite REST API işlemleri

import {
  PROJECT_ID as APPWRITE_PROJECT,
  DATABASE_ID,
  MOVIES_COLLECTION_ID,
} from "./appwrite";

import { fetchMovieDetails } from "./tmdb";

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

// Kullanıcı bilgilerini JWT ile al
export const fetchCurrentUser = async (jwt: string): Promise<any | null> => {
  try {
    const res = await fetch("https://cloud.appwrite.io/v1/account", {
      method: "GET",
      headers: {
        "X-Appwrite-Project": APPWRITE_PROJECT,
        "Authorization": `Bearer ${jwt}`,
      },
    });

    if (!res.ok) {
      console.log("🔴 Giriş başarısız:", await res.text());
      return null;
    }

    const user = await res.json();
    return user;
  } catch (err) {
    console.log("🔴 fetchCurrentUser error:", err);
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

// Oturum kapatma (JWT gerekmez)
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
