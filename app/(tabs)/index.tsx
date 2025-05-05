import { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router"; // 🔥 yönlendirme için

import { fetchMovies } from "@/services/api";
import {
  getTrendingMovies,
  updateSearchCount,
  account,
} from "@/services/appwrite";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import TrendingCard from "@/components/TrendingCard";

const Index = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Kullanıcı oturum kontrolü
  useEffect(() => {
    const ensureSession = async () => {
      try {
        const user = await account.get();

        if (user.email && user.email.trim() !== "") {
          setReady(true);
        } else {
          throw new Error("Anonim kullanıcı");
        }
      } catch (err) {
        console.log("🔴 Giriş yapılmamış kullanıcı:", err);
        router.replace("/(auth)/login"); // ❗ Otomatik yönlendir
      }
    };

    ensureSession();
  }, []);

  // 📦 Girişli kullanıcı için veri çekimi
  useEffect(() => {
    if (!ready) return;

    const fetchAll = async () => {
      try {
        const [trending, all] = await Promise.all([
          getTrendingMovies(),
          fetchMovies({ query: "" }),
        ]);
        setTrendingMovies(trending);
        setMovies(all);
      } catch (error) {
        console.error("Film verisi alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [ready]);

  // 🔍 Arama işlemi
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (searchQuery.trim() !== "") {
        try {
          setSearchLoading(true);
          const result = await fetchMovies({ query: searchQuery });
          setSearchResults(result);
          if (result.length > 0) {
            await updateSearchCount(searchQuery, result[0]);
          }
        } catch (err) {
          console.error("Arama başarısız:", err);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // 🔃 Giriş kontrolü ve veri yüklenmemişse
  if (!ready || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-2">Veriler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary">
  <Image
  source={images.bg}
  style={{ position: "absolute", width: "100%", zIndex: 0 }}
  resizeMode="cover"
/>


      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }}
      >
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

        <SearchBar
          placeholder="Search for a movie"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchLoading && (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            className="mt-5 self-center"
          />
        )}

        {searchQuery.trim() && searchResults !== null ? (
          <View className="mt-8">
            <Text className="text-lg text-white font-bold mb-3">
              Search Results for{" "}
              <Text className="text-accent">{searchQuery}</Text>
            </Text>

            {searchResults.length === 0 ? (
              <Text className="text-gray-400">No movies found.</Text>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={({ item }) => <MovieCard {...item} />}
                keyExtractor={(item) => `search-${item.id}`}
                numColumns={3}
                columnWrapperStyle={{
                  justifyContent: "flex-start",
                  gap: 20,
                  paddingRight: 5,
                  marginBottom: 10,
                }}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : (
          <View className="flex-1 mt-5">
            <View className="mt-10">
              <Text className="text-lg text-white font-bold mb-3">
                Trending Movies
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4 mt-3"
                data={trendingMovies}
                contentContainerStyle={{ gap: 26 }}
                renderItem={({ item, index }) => (
                  <TrendingCard movie={item} index={index} />
                )}
                keyExtractor={(item) => `trending-${item.movie_id}`}
                ItemSeparatorComponent={() => <View className="w-4" />}
              />
            </View>

            <Text className="text-lg text-white font-bold mt-5 mb-3">
              Latest Movies
            </Text>

            <FlatList
              data={movies}
              renderItem={({ item }) => <MovieCard {...item} />}
              keyExtractor={(item) => `latest-${item.id}`}
              numColumns={3}
              columnWrapperStyle={{
                justifyContent: "flex-start",
                gap: 20,
                paddingRight: 5,
                marginBottom: 10,
              }}
              className="mt-2 pb-32"
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Index;
