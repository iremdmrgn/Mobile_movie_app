import { Client, Databases, Account, ID, Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;

export const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const database = new Databases(client);
export const account = new Account(client); // ✅ EKLENDİ

// Arama sayacı fonksiyonu
export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("movie_id", movie.id),
    ]);

    if (result.documents.length > 0) {
      const existingMovie = result.documents[0];
      await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existingMovie.$id,
        {
          count: existingMovie.count + 1,
        }
      );
    } else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm: query,
        movie_id: movie.id,
        title: movie.title,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

// En çok arananları getir
export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(20),
      Query.orderDesc("count"),
    ]);

    const uniqueMovies = new Map<string, TrendingMovie>();
    for (const doc of result.documents as TrendingMovie[]) {
      if (!uniqueMovies.has(doc.movie_id)) {
        uniqueMovies.set(doc.movie_id, doc);
      }
    }

    return Array.from(uniqueMovies.values()).slice(0, 5);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return undefined;
  }
};
