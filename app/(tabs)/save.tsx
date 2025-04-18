// Save.tsx (COLLECTION DELETE AND ADD FLOW)
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSavedMoviesByUser, saveMovie } from "@/services/savedMovies";
import {
  createCollection,
  deleteCollectionByTitle,
} from "@/services/movieCollections";
import { fetchMovies } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icons";
import { useFocusEffect } from "expo-router";

const Save = () => {
  const [savedMovies, setSavedMovies] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollectionTitle, setSelectedCollectionTitle] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [moviesToPick, setMoviesToPick] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);

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

  const handleCreateCollection = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const collectionId = await createCollection(newTitle.trim());
      setSelectedCollectionId(collectionId);
      setSelectedCollectionTitle(newTitle.trim());
      setShowCreateModal(false);
      setNewTitle("");
      setSelectMode(true);
      fetchSearchResults("");
    } catch (err) {
      console.error("Collection create error:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = (category: string) => {
    Alert.alert("Delete Collection", `Do you want to delete the ${category} collection?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCollectionByTitle(category);
            fetchSaved();
          } catch (err) {
            console.error("Delete error:", err);
          }
        },
      },
    ]);
  };

  const fetchSearchResults = async (query: string) => {
    try {
      setSearchLoading(true);
      const data = await fetchMovies({ query });
      setMoviesToPick(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleMovie = (movieId: number) => {
    setSelectedMovies((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleConfirmSelection = async () => {
    const selected = moviesToPick.filter((movie) => selectedMovies.includes(movie.id));
    for (const movie of selected) {
      await saveMovie(movie, selectedCollectionTitle);
    }
    setSelectMode(false);
    setSelectedCollectionId(null);
    setSelectedCollectionTitle("");
    setSelectedMovies([]);
    fetchSaved();
  };

  const hasMovies = Object.keys(savedMovies).length > 0;

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      <TouchableOpacity
        onPress={() => setShowCreateModal(true)}
        className="bg-accent px-4 py-2 rounded-xl self-start mt-6"
      >
        <Text className="text-white font-semibold">+ Create New Collection</Text>
      </TouchableOpacity>

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-8">
          <View className="bg-white rounded-xl p-6 w-full">
            <Text className="text-lg font-bold text-black mb-3">Collection Name</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Weekend Movies"
              className="border border-gray-300 px-4 py-2 rounded-md text-black"
            />
            <View className="flex-row justify-end mt-4 gap-3">
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateCollection} disabled={creating}>
                <Text className="text-accent font-semibold">
                  {creating ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={selectMode} animationType="slide">
        <SafeAreaView className="flex-1 bg-primary px-5">
          <Text className="text-white font-bold text-xl mt-6 mb-4">Add Movies to Collection</Text>

          <SearchBar
            placeholder="Search movies..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              fetchSearchResults(text);
            }}
          />

          {searchLoading ? (
            <ActivityIndicator className="mt-4" />
          ) : (
            <FlatList
              data={moviesToPick}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleToggleMovie(item.id)} className="w-[30%] relative">
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                    style={{ opacity: selectedMovies.includes(item.id) ? 0.5 : 1 }}
                  />
                  {selectedMovies.includes(item.id) && (
                    <View className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <Text className="text-xs text-black font-bold">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity
            className="bg-accent px-4 py-3 rounded-xl mt-5"
            onPress={handleConfirmSelection}
          >
            <Text className="text-white text-center font-semibold">Done</Text>
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
          {Object.entries(savedMovies).map(([category, movies]) => (
            <View key={category} className="mb-8">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white font-bold text-lg">{category}</Text>
                {category !== "Favorites" && (
                  <TouchableOpacity onPress={() => handleDeleteCollection(category)}>
                    <Text className="text-red-500 text-sm">Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row flex-wrap gap-4">
                {movies.map((movie: any) => (
                  <MovieCard
                    key={movie.movie_id}
                    id={movie.movie_id}
                    title={movie.title}
                    poster_path={
                      movie.poster_url?.replace("https://image.tmdb.org/t/p/w500", "") || ""
                    }
                    vote_average={movie.vote_average || 5}
                    release_date={movie.release_date || "2024-01-01"}
                    onUnsave={fetchSaved}
                    onSave={fetchSaved}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Save;
