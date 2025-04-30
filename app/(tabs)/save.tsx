import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getSavedMoviesByUser,
  saveMovie,
  unsaveMovie,
} from "@/services/savedMovies";
import { createCollection } from "@/services/movieCollections";
import MovieCard from "@/components/MovieCard";
import useFetch from "@/services/useFetch";
import { getTrendingMovies } from "@/services/appwrite";
import { useFocusEffect } from "expo-router";

const Save = () => {
  const [groupedMovies, setGroupedMovies] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectingCategory, setSelectingCategory] = useState<string | null>(null);

  const {
    data: trending,
    loading: trendingLoading,
  } = useFetch(getTrendingMovies);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const data = await getSavedMoviesByUser();
      const groupedFiltered: Record<string, any[]> = {};
      for (const category in data) {
        const uniqueMap = new Map();
        data[category].forEach((movie: any) => {
          if (!uniqueMap.has(movie.movie_id)) {
            uniqueMap.set(movie.movie_id, movie);
          }
        });
        groupedFiltered[category] = Array.from(uniqueMap.values());
      }
      setGroupedMovies(groupedFiltered);
    } catch (err) {
      console.error("Saved movies fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await createCollection(newCategory.trim());
      setModalVisible(false);
      setNewCategory("");
      await fetchSaved();
    } catch (err) {
      console.error("Kategori oluşturulamadı:", err);
    }
  };

  const handleSaveToCategory = async (movie: any) => {
    if (!selectingCategory) return;
    try {
      await saveMovie({
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        category: selectingCategory,
      });
      setSelectingCategory(null);
      await fetchSaved();
    } catch (err) {
      console.error("Film eklenemedi:", err);
    }
  };

  const handleUnsaveMovie = async (movieId: number) => {
    try {
      await unsaveMovie(movieId);
      await fetchSaved();
    } catch (err) {
      console.error("Film silinemedi:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [])
  );

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      <View className="flex-row justify-between items-center mt-6 mb-4">
        <Text className="text-white font-bold text-xl">Your Collections</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Loading...</Text>
        </View>
      ) : Object.keys(groupedMovies).length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-base">
            You haven’t saved any movies yet.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="pb-16">
          {Object.keys(groupedMovies).map((category) => (
            <View key={category} className="mb-8">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white font-bold text-lg">{category}</Text>
                <TouchableOpacity onPress={() => setSelectingCategory(category)}>
                  <Text className="text-accent text-sm">+ Add Movie</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-4">
                {groupedMovies[category].map((movie: any) => (
                  <MovieCard
                    key={movie.$id || movie.movie_id}
                    id={movie.movie_id}
                    title={movie.title}
                    poster_path={movie.poster_url || ""}
                    vote_average={movie.vote_average || 5}
                    release_date={movie.release_date || "2024-01-01"}
                    onUnsave={() => handleUnsaveMovie(movie.movie_id)}
                    onSave={fetchSaved}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Kategori oluşturma */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center px-8">
          <View className="bg-dark-100 w-full p-6 rounded-xl">
            <Text className="text-white font-bold text-lg mb-4">
              Create New Category
            </Text>
            <TextInput
              placeholder="Enter category name"
              placeholderTextColor="#999"
              className="bg-dark-200 text-white px-4 py-3 rounded-xl mb-4"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity
              className="bg-secondary py-3 rounded-xl"
              onPress={handleAddCategory}
            >
              <Text className="text-white text-center font-semibold">
                Create
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-4"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-gray-400 text-center text-sm underline">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Film ekleme */}
      <Modal visible={!!selectingCategory} transparent animationType="slide">
        <View className="flex-1 bg-black/80 px-6 pt-20">
          <View className="bg-dark-100 p-5 rounded-xl">
            <Text className="text-white font-bold text-lg mb-4">
              Select Movie to Add to {selectingCategory}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {trending?.slice(0, 10).map((movie: any) => (
                  <TouchableOpacity
                    key={movie.id}
                    onPress={() => handleSaveToCategory(movie)}
                  >
                    <MovieCard
                      id={movie.id}
                      title={movie.title}
                      poster_path={movie.poster_path}
                      vote_average={movie.vote_average}
                      release_date={movie.release_date}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              className="mt-4"
              onPress={() => setSelectingCategory(null)}
            >
              <Text className="text-gray-400 text-center text-sm underline">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Save;
