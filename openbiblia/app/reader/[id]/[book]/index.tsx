import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getChapters } from "@/services/bible-db";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ChaptersScreen() {
  const { id, book } = useLocalSearchParams<{ id: string; book: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const numColumns = Math.floor((width - 32) / 72);
  const cellBg = useThemeColor(
    { light: "#f0f0f0", dark: "#2c2c2e" },
    "background",
  );
  const accent = useThemeColor({ light: "#0a7ea4", dark: "#5ac8fa" }, "tint");

  useEffect(() => {
    getChapters(id, book).then((c) => {
      setChapters(c);
      setLoading(false);
    });
  }, [id, book]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: book }} />
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: book }} />
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/reader/${id}/${book}/${item}`)}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: pressed ? accent : cellBg,
              },
            ]}
          >
            {({ pressed }) => (
              <ThemedText
                style={[styles.chapterNum, pressed && { color: "#fff" }]}
              >
                {item}
              </ThemedText>
            )}
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { padding: 16, gap: 10 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    maxWidth: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chapterNum: {
    fontSize: 20,
    fontWeight: "600",
  },
});
