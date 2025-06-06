import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { icons } from "@/constants/icons";
import useFetch from "@/services/useFetch";
import { fetchMovieDetails } from "@/services/api";
import {
  saveMovie,
  unsaveMovie,
  isMovieAlreadySaved,
} from "@/services/savedMovies";
import { checkUserLoggedIn, updateSearchCount } from "@/services/appwrite";

interface MovieInfoProps {
  label: string;
  value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
  <View className="flex-col items-start justify-center mt-5">
    <Text className="text-light-200 font-normal text-sm">{label}</Text>
    <Text className="text-light-100 font-bold text-sm mt-2">
      {value || "N/A"}
    </Text>
  </View>
);

const Details = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isSaved, setIsSaved] = useState(false);

  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string)
  );

  useEffect(() => {
    const checkSavedAndUpdateTrending = async () => {
      const saved = await isMovieAlreadySaved(Number(id));
      setIsSaved(saved);

      if (movie?.id && movie?.title && movie?.poster_path) {
        await updateSearchCount(movie.title, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        });
      }
    };

    if (id && movie) checkSavedAndUpdateTrending();
  }, [id, movie]);

  const handleSaveToggle = async () => {
    try {
      const user = await checkUserLoggedIn();
      if (!user) {
        router.push("/login");
        return;
      }

      if (!movie?.id || !movie?.title || !movie?.poster_path) return;

      if (isSaved) {
        await unsaveMovie(movie.id);
        setIsSaved(false);
      } else {
        await saveMovie({
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save toggle error:", err);
    }
  };

  if (loading)
    return (
      <SafeAreaView className="bg-primary flex-1">
        <ActivityIndicator />
      </SafeAreaView>
    );

  return (
    <View className="bg-primary flex-1 relative">
      <TouchableOpacity
        onPress={router.back}
        className="absolute top-14 left-5 z-50 bg-dark-100/60 p-2 rounded-full"
      >
        <Image
          source={icons.arrow}
          className="size-5 rotate-180"
          tintColor="#fff"
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="relative">
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
            }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />

          <TouchableOpacity
            onPress={handleSaveToggle}
            className="absolute top-10 right-5 z-10 bg-white/90 p-3 rounded-full"
          >
            <Image
              source={isSaved ? icons.saveFilled : icons.save}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity className="absolute bottom-5 right-5 rounded-full size-14 bg-white flex items-center justify-center">
            <Image
              source={icons.play}
              className="w-6 h-7 ml-1"
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{movie?.title}</Text>

          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-light-200 text-sm">
              {movie?.release_date?.split("-")[0]} •
            </Text>
            <Text className="text-light-200 text-sm">{movie?.runtime}m</Text>
          </View>

          <View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
            <Image source={icons.star} className="size-4" />
            <Text className="text-white font-bold text-sm">
              {Math.round(movie?.vote_average ?? 0)}/10
            </Text>
            <Text className="text-light-200 text-sm">
              ({movie?.vote_count} votes)
            </Text>
          </View>

          <MovieInfo label="Overview" value={movie?.overview} />
          <MovieInfo
            label="Genres"
            value={movie?.genres?.map((g) => g.name).join(" • ") || "N/A"}
          />

          <View className="flex flex-row justify-between w-1/2">
            <MovieInfo
              label="Budget"
              value={`$${(movie?.budget ?? 0) / 1_000_000} million`}
            />
            <MovieInfo
              label="Revenue"
              value={`$${Math.round((movie?.revenue ?? 0) / 1_000_000)} million`}
            />
          </View>

          <MovieInfo
            label="Production Companies"
            value={
              movie?.production_companies
                ?.map((c) => c.name)
                .join(" • ") || "N/A"
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Details;