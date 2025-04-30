import {
  Client,
  Account,
  Databases,
  ID,
  Query,
  Permission,
  Role,
} from "react-native-appwrite";

// 🌍 Environment değişkenleri (.env dosyasından alınır)
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const MOVIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;
const SAVED_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

// ✅ Appwrite Client oluşturuluyor
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID)
  .setPlatform("host.exp.Exponent"); // ✅ Expo Go’nun sabit platform ID’si

// ✅ Servisler
export const account = new Account(client);
export const databases = new Databases(client);
export { client, ID, Query, Permission, Role };

// 🔐 Kullanıcı oturum kontrolü
export const checkUserLoggedIn = async () => {
  try {
    const user = await account.get();
    return user;
  } catch {
    return null;
  }
};



// 🔥 Trend olan filmleri getir (sadece 10 benzersiz)
export const getTrendingMovies = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      MOVIES_COLLECTION_ID,
      [Query.orderDesc("count"), Query.limit(100)]
    );

    const uniqueMap = new Map();

    for (const doc of response.documents) {
      if (!uniqueMap.has(doc.movie_id)) {
        uniqueMap.set(doc.movie_id, {
          $id: doc.$id,
          movie_id: doc.movie_id,
          title: doc.title,
          count: doc.count ?? 0,
          poster_url: doc.poster_url,
          searchTerm: doc.searchTerm ?? "",
        });
      }

      if (uniqueMap.size === 10) break; // ✅ Sadece 10 benzersiz film alınca dur
    }

    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error("Trend filmler alınamadı:", error);
    return [];
  }
};

// 🔁 Arama sayısını güncelle (döküman yoksa oluştur)
export const updateSearchCount = async (query: string, movie: any) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      MOVIES_COLLECTION_ID,
      [Query.equal("movie_id", movie.id)]
    );

    if (response.total > 0) {
      const doc = response.documents[0];
      await databases.updateDocument(
        DATABASE_ID,
        MOVIES_COLLECTION_ID,
        doc.$id,
        {
          count: (doc.count || 0) + 1,
        }
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        MOVIES_COLLECTION_ID,
        ID.unique(),
        {
          movie_id: movie.id,
          title: movie.title,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          count: 1,
          searchTerm: query.toLowerCase(),
        }
      );
    }
  } catch (error) {
    console.error(`Search count güncellenemedi: ${query}`, error);
  }
};

// 📂 Film kaydet
export const saveMovie = async ({
  movieId,
  title,
  poster_path,
}: {
  movieId: number;
  title: string;
  poster_path: string;
}) => {
  try {
    const user = await account.get();

    await databases.createDocument(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        movieId,
        title,
        poster_path,
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
      ]
    );
  } catch (error) {
    console.error("Film kaydedilemedi:", error);
  }
};
