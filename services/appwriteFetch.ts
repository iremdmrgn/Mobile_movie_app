// ⚙️ Gerekli dış kütüphane
import { v4 as uuidv4 } from "uuid";

const APPWRITE_PROJECT = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;

// ✅ Email/password ile kullanıcı kaydı
export const emailPasswordRegister = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const response = await fetch("https://cloud.appwrite.io/v1/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT,
      },
      body: JSON.stringify({
        userId: uuidv4(),
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
  } catch (err) {
    throw err;
  }
};

// ✅ Giriş
export const emailPasswordLogin = async (email: string, password: string) => {
  try {
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
  } catch (err) {
    throw err;
  }
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

    return await response.json();
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