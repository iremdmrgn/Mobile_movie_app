import { Link, useRouter } from "expo-router";
import {
  Text,
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useState, useEffect } from "react";

import { icons } from "@/constants/icons";
import {
  saveMovie,
  isMovieAlreadySaved,
  unsaveMovie,
} from "@/services/savedMovies";

import { checkUserLoggedIn } from "@/services/appwriteFetch";

type MovieCardProps = {
  id: number;
  title: string;
  poster_path: string | null;
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
        await saveMovie({ movieId: id, title, poster_path: poster_path || "" });
        setIsSaved(true);
        onSave?.();
      } catch (err) {
        console.error("Save error:", err);
      }
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Kaydet ikonu */}
      <TouchableOpacity onPress={handleSaveToggle} style={styles.saveButton}>
        <Image
          source={isSaved ? icons.saveFilled : icons.save}
          style={styles.iconSmall}
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
            style={styles.poster}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </Link>

      {/* Film bilgisi */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.ratingRow}>
        <Image source={icons.star} style={styles.star} />
        <Text style={styles.ratingText}>{Math.round(vote_average / 2)}</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.metaText}>{release_date?.split("-")[0]}</Text>
        <Text style={styles.metaText}>Movie</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "30%",
    position: "relative",
  },
  saveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: 8,
  },
  iconSmall: {
    width: 20,
    height: 20,
  },
  poster: {
    width: "100%",
    height: 208,
    borderRadius: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  star: {
    width: 16,
    height: 16,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#9CA4AB",
    fontWeight: "500",
    textTransform: "uppercase",
  },
});

export default MovieCard;
