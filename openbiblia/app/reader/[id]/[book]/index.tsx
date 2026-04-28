import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getChapters } from "@/services/bible-db";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ChaptersScreen() {
  const { id, book } = useLocalSearchParams<{ id: string; book: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const numColumns = Math.floor((width - 32) / 72);

  useEffect(() => {
    getChapters(id, book).then((c) => {
      setChapters(c);
      setLoading(false);
    });
  }, [id, book]);

  if (loading) {
    return (
      <ThemedView style={s.center}>
        <Stack.Screen options={{ title: book }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ title: book }} />
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              router.push(`/reader/${id}/${book}/${item}`);
            }}
            style={({ pressed }) => [
              s.cell,
              pressed && { backgroundColor: colors.tint },
            ]}
          >
            {({ pressed }) => (
              <ThemedText style={[s.chapterNum, pressed && { color: "#fff" }]}>
                {item}
              </ThemedText>
            )}
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    grid: { padding: 16, gap: 10 },
    cell: {
      flex: 1,
      aspectRatio: 1,
      margin: 5,
      maxWidth: 64,
      borderRadius: 16,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    chapterNum: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
  });
}
