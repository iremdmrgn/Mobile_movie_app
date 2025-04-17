import { Client, Databases, ID, Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const database = new Databases(client);

// ✅ Arama yapılan film zaten varsa sayacını artır, yoksa yeni belge oluştur
export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("movie_id", movie.id), // Burayı değiştirdik!
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

// ✅ En çok aranan filmleri getir (tekrar eden movie_id'leri filtrele)
export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(20), // Daha fazla veri alalım ki filtreleme sonrası 5 kalsın
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
