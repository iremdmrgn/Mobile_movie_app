// Save.tsx
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSavedMoviesByUser, saveMovie, isMovieAlreadySaved } from "@/services/savedMovies";
import { createCollection } from "@/services/movieCollections";
import { fetchMovies } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import { icons } from "@/constants/icons";
import { useFocusEffect } from "expo-router";

const Save = () => {
  const [savedMovies, setSavedMovies] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedCollectionTitle, setSelectedCollectionTitle] = useState<string | null>(null);
  const [moviesToPick, setMoviesToPick] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const data = await getSavedMoviesByUser();
      setSavedMovies(data);
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

  const toggleCategory = (category: string) => {
    if (category === "Favoriler") return;
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCreateCollection = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      await createCollection(newTitle.trim());
      setSelectedCollectionTitle(newTitle.trim());
      const result = await fetchMovies({ query: "" });
      setMoviesToPick(result);
      setSelectMode(true);
    } catch (err) {
      console.error("Collection create error:", err);
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewTitle("");
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedMovies((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleCompleteSelection = async () => {
    if (!selectedCollectionTitle) return;
    try {
      const selected = moviesToPick.filter((m) => selectedMovies.includes(m.id));
      for (const movie of selected) {
        const already = await isMovieAlreadySaved(movie.id);
        if (!already) {
          await saveMovie(movie, selectedCollectionTitle);
        }
      }
      fetchSaved();
      setSelectMode(false);
      setSelectedMovies([]);
      setSelectedCollectionTitle(null);
    } catch (err) {
      console.error("Complete selection error:", err);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      const result = await fetchMovies({ query: "" });
      setMoviesToPick(result);
      return;
    }
    try {
      setSearching(true);
      const result = await fetchMovies({ query: text });
      setMoviesToPick(result);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const hasMovies = Object.keys(savedMovies).length > 0;

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      <TouchableOpacity
        onPress={() => setShowCreateModal(true)}
        className="bg-accent px-4 py-2 rounded-xl self-start mt-6"
      >
        <Text className="text-white font-semibold">+ Yeni Koleksiyon Oluştur</Text>
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-8">
          <View className="bg-white rounded-xl p-6 w-full">
            <Text className="text-lg font-bold text-black mb-3">Koleksiyon Adı</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Hafta Sonu Filmleri"
              className="border border-gray-300 px-4 py-2 rounded-md text-black"
            />
            <View className="flex-row justify-end mt-4 gap-3">
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text className="text-gray-600">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateCollection} disabled={creating}>
                <Text className="text-accent font-semibold">
                  {creating ? "Ekleniyor..." : "Oluştur"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={selectMode} animationType="slide">
        <SafeAreaView className="flex-1 bg-primary px-5">
          <Text className="text-white font-bold text-xl mt-6 mb-4">Filmleri Seç</Text>
          <TextInput
            placeholder="Film ara..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={handleSearch}
            className="bg-dark-200 text-white px-4 py-2 rounded-lg mb-4"
          />

          {searching ? (
            <ActivityIndicator color="#fff" className="mt-10" />
          ) : (
            <ScrollView>
              <View className="flex-row flex-wrap gap-4">
                {moviesToPick.map((movie) => {
                  const isSelected = selectedMovies.includes(movie.id);
                  return (
                    <TouchableOpacity
                      key={movie.id}
                      onPress={() => handleToggleSelect(movie.id)}
                      className={`w-[30%] border-2 rounded-lg overflow-hidden ${
                        isSelected ? "border-accent" : "border-transparent"
                      }`}
                    >
                      <Image
                        source={{
                          uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                        }}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <TouchableOpacity
            className="bg-accent px-4 py-3 rounded-xl mt-5"
            onPress={handleCompleteSelection}
          >
            <Text className="text-white text-center font-semibold">Tamamla</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Loading...</Text>
        </View>
      ) : !hasMovies ? (
        <View className="flex justify-center items-center flex-1 flex-col gap-5">
          <Image source={icons.save} className="size-10" tintColor="#fff" />
          <Text className="text-gray-500 text-base">
            You haven’t saved any movies yet.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="pt-8">
          {Object.entries(savedMovies).map(([category, movies]) => {
            const isExpanded = category === "Favoriler" || (expandedCategories[category] ?? false);

            return (
              <View key={category} className="mb-8">
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  className="flex-row justify-between items-center mb-4"
                  disabled={category === "Favoriler"}
                >
                  <Text className="text-white font-bold text-lg">
                    {category}
                  </Text>
                  {category !== "Favoriler" && (
                    <Text className="text-accent font-bold text-xl">
                      {isExpanded ? "−" : "+"}
                    </Text>
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View className="flex-row flex-wrap gap-4">
                    {movies.map((movie: any) => (
                      <MovieCard
                        key={movie.movie_id}
                        id={movie.movie_id}
                        title={movie.title}
                        poster_path={
                          movie.poster_url?.replace(
                            "https://image.tmdb.org/t/p/w500",
                            ""
                          ) || ""
                        }
                        vote_average={movie.vote_average || 5}
                        release_date={movie.release_date || "2024-01-01"}
                        onUnsave={fetchSaved}
                        onSave={fetchSaved}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Save;