import { PROJECT_ID, DATABASE_ID, MOVIES_COLLECTION_ID } from "./appwrite";

export const getTrendingMovies = async (): Promise<any[]> => {
  const endpoint = `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${MOVIES_COLLECTION_ID}/documents`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT_ID,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("getTrendingMovies hatası:", error);
      return [];
    }

    const data = await response.json();

    return data.documents
      .filter((doc: any) => typeof doc.movie_id === "number" || typeof doc.movie_id === "string")
      .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      .slice(0, 10);
  } catch (error) {
    console.error("getTrendingMovies hatası:", error);
    return [];
  }
};
