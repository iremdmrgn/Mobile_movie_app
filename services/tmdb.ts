const TMDB_API_KEY = process.env.EXPO_PUBLIC_MOVIE_API_KEY;

const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
};

export const fetchMovies = async ({ query }: { query: string }) => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/movie/now_playing`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TMDB API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.results;
};

// ✅ Tekil film detaylarını TMDB'den al
export const fetchMovieDetails = async (id: number) => {
  const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/${id}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TMDB detail error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data;
};
