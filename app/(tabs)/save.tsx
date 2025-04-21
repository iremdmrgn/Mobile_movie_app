// Save.tsx (KATEGORİLER KALDIRILDI - TEK FAVORİ GRUBU)
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSavedMoviesByUser } from "@/services/savedMovies";
import MovieCard from "@/components/MovieCard";
import { icons } from "@/constants/icons";
import { useFocusEffect } from "expo-router";

const Save = () => {
  const [savedMovies, setSavedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const data = await getSavedMoviesByUser();

      // 🔁 Aynı movie_id'ye sahip olanları filtrele
      const uniqueMap = new Map();
      data.Favorites?.forEach((movie: any) => {
        if (!uniqueMap.has(movie.movie_id)) {
          uniqueMap.set(movie.movie_id, movie);
        }
      });

      setSavedMovies(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error("Saved movies fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [])
  );

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Loading...</Text>
        </View>
      ) : savedMovies.length === 0 ? (
        <View className="flex justify-center items-center flex-1 flex-col gap-5">
          <Image source={icons.save} className="size-10" tintColor="#fff" />
          <Text className="text-gray-500 text-base">
            You haven’t saved any movies yet.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="pt-8">
          <Text className="text-white font-bold text-lg mb-3">Favorites</Text>
          <View className="flex-row flex-wrap gap-4">
            {savedMovies.map((movie: any) => (
              <MovieCard
                key={movie.$id || movie.movie_id}
                id={movie.movie_id}
                title={movie.title}
                poster_path={movie.poster_url || ""}
                vote_average={movie.vote_average || 5}
                release_date={movie.release_date || "2024-01-01"}
                onUnsave={fetchSaved}
                onSave={fetchSaved}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Save;
