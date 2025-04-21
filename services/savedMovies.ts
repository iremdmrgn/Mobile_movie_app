// savedMovies.ts
import { Databases, ID, Permission, Role, Query } from "react-native-appwrite";
import { client, account } from "./appwrite";

const database = new Databases(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;

// 🎯 Film kaydetme (kategori kaldırıldı)
export const saveMovie = async ({ movieId, title, poster_path }: {
  movieId: number;
  title: string;
  poster_path: string;
}) => {
  try {
    const user = await account.get();

    const payload = {
      userId: user.$id,
      movie_id: movieId,
      title,
      poster_url: `https://image.tmdb.org/t/p/w500${poster_path}`,
    };
    

    await database.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      payload,
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
      ]
    );
  } catch (error) {
    console.error("saveMovie error:", error);
  }
};

// 🎯 Film kaydını silme (toggle için)
export const unsaveMovie = async (movieId: number) => {
  try {
    const user = await account.get();

    const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.equal("movie_id", movieId),
      Query.limit(1),
    ]);

    if (response.documents.length > 0) {
      const docId = response.documents[0].$id;
      await database.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
    }
  } catch (error) {
    console.error("unsaveMovie error:", error);
  }
};

// 🎯 Kullanıcının kaydettiği filmleri getir (kategori olmadan düz liste)
export const getSavedMoviesByUser = async () => {
  try {
    const user = await account.get();

    const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.limit(100),
    ]);

    return { Favorites: response.documents }; // Tek koleksiyon gibi döndür
  } catch (error) {
    console.error("getSavedMoviesByUser error:", error);
    return {};
  }
};

// 🎯 Belirli bir film zaten kaydedilmiş mi? (ikon durumu için)
export const isMovieAlreadySaved = async (movieId: number) => {
  try {
    const user = await account.get();

    const response = await database.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.equal("movie_id", movieId),
        Query.limit(1),
      ]
    );

    return response.total > 0;
  } catch (error) {
    console.error("isMovieAlreadySaved error:", error);
    return false;
  }
};
