import { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  FlatList,
} from "react-native";

import useFetch from "@/services/useFetch";
import { fetchMovies } from "@/services/api";
import { getTrendingMovies, updateSearchCount } from "@/services/appwrite";
import { account } from "@/services/appwrite"; // ✅ Appwrite account

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import TrendingCard from "@/components/TrendingCard";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ready, setReady] = useState(false); // ✅ Oturum hazır mı?

  // ✅ Appwrite'a anonim login - sadece bir kere yapılır
  useEffect(() => {
    const ensureAnonymousSession = async () => {
      try {
        await account.get(); // Oturum varsa sorun yok
        setReady(true);
      } catch (err) {
        try {
          await account.createAnonymousSession(); // Yoksa oluştur
          setReady(true);
        } catch (error) {
          console.error("Anonim oturum açılırken hata:", error);
        }
      }
    };

    ensureAnonymousSession();
  }, []);

  const {
    data: trendingMovies,
    loading: trendingLoading,
    error: trendingError,
  } = useFetch(getTrendingMovies);

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
  } = useFetch(() => fetchMovies({ query: "" }));

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
          console.error("Search failed:", err);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // ✅ Oturum hazır değilse loader göster
  if (!ready) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-2">Oturum başlatılıyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute w-full z-0"
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
                keyExtractor={(item) => item.id.toString()}
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
            {trendingMovies && (
              <View className="mt-10">
                <Text className="text-lg text-white font-bold mb-3">
                  Trending Movies
                </Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4 mt-3"
                  data={trendingMovies}
                  contentContainerStyle={{
                    gap: 26,
                  }}
                  renderItem={({ item, index }) => (
                    <TrendingCard movie={item} index={index} />
                  )}
                  keyExtractor={(item) => item.movie_id.toString()}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                />
              </View>
            )}

            <Text className="text-lg text-white font-bold mt-5 mb-3">
              Latest Movies
            </Text>

            <FlatList
              data={movies}
              renderItem={({ item }) => <MovieCard {...item} />}
              keyExtractor={(item) => item.id.toString()}
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
