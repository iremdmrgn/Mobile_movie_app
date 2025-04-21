import { Link, useRouter } from "expo-router";
import {
  Text,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { useState, useEffect } from "react";

import { icons } from "@/constants/icons";
import {
  saveMovie,
  isMovieAlreadySaved,
  unsaveMovie,
} from "@/services/savedMovies";

import { checkUserLoggedIn } from "@/services/appwrite";

type MovieCardProps = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  onUnsave?: () => void;
  onSave?: () => void;
};

const MovieCard = ({
  id,
  title,
  poster_path,
  vote_average,
  release_date,
  onUnsave,
  onSave,
}: MovieCardProps) => {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const checkIfSaved = async () => {
      const alreadySaved = await isMovieAlreadySaved(id);
      setIsSaved(alreadySaved);
    };

    checkIfSaved();
  }, []);

  const handleSaveToggle = async () => {
    const user = await checkUserLoggedIn();

    if (!user) {
      router.push("/login");
      return;
    }

    if (isSaved) {
      await unsaveMovie(id);
      setIsSaved(false);
      onUnsave?.();
    } else {
      try {
        await saveMovie({ movieId: id, title, poster_path });
        setIsSaved(true);
        onSave?.();
      } catch (err) {
        console.error("Save error:", err);
      }
    }
  };

  return (
    <View className="w-[30%] relative">
      {/* Kaydet ikonu */}
      <TouchableOpacity
        onPress={handleSaveToggle}
        className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-2"
      >
        <Image
          source={isSaved ? icons.saveFilled : icons.save}
          className="w-5 h-5"
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Film görseli */}
      <Link href={`/movies/${id}`} asChild>
        <TouchableOpacity>
          <Image
            source={{
              uri: poster_path
                ? `https://image.tmdb.org/t/p/w500${poster_path}`
                : "https://placehold.co/600x400/1a1a1a/FFFFFF.png",
            }}
            className="w-full h-52 rounded-lg"
            resizeMode="cover"
          />
        </TouchableOpacity>
      </Link>

      {/* Film bilgisi */}
      <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
        {title}
      </Text>

      <View className="flex-row items-center justify-start gap-x-1">
        <Image source={icons.star} className="size-4" />
        <Text className="text-xs text-white font-bold uppercase">
          {Math.round(vote_average / 2)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-light-300 font-medium mt-1">
          {release_date?.split("-")[0]}
        </Text>
        <Text className="text-xs font-medium text-light-300 uppercase">
          Movie
        </Text>
      </View>
    </View>
  );
};

export default MovieCard;
