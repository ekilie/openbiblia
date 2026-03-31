import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getVerses } from "@/services/bible-db";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { Verse } from "@/services/types";

export default function ReaderScreen() {
  const { id, book, chapter } = useLocalSearchParams<{
    id: string;
    book: string;
    chapter: string;
  }>();
  const insets = useSafeAreaInsets();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = useThemeColor({ light: "#0a7ea4", dark: "#5ac8fa" }, "tint");
  const divider = useThemeColor({ light: "#e0e0e0", dark: "#333" }, "background");

  const chapterNum = parseInt(chapter, 10);

  useEffect(() => {
    getVerses(id, book, chapterNum).then((v) => {
      setVerses(v);
      setLoading(false);
    });
  }, [id, book, chapterNum]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: `${book} ${chapter}` }} />
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `${book} ${chapter}` }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={[styles.headerLine, { backgroundColor: divider }]} />
          <ThemedText style={[styles.heading, { color: accent }]}>
            {chapter}
          </ThemedText>
          <View style={[styles.headerLine, { backgroundColor: divider }]} />
        </View>

        <ThemedText style={styles.body}>
          {verses.map((v) => (
            <ThemedText key={v.id}>
              <ThemedText style={[styles.verseNum, { color: accent }]}>
                {v.verse}{" "}
              </ThemedText>
              <ThemedText style={styles.verseText}>{v.text} </ThemedText>
            </ThemedText>
          ))}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    gap: 16,
  },
  headerLine: { flex: 1, height: 1 },
  heading: {
    fontSize: 32,
    fontWeight: "800",
  },
  body: {
    fontSize: 19,
    lineHeight: 32,
  },
  verseText: {
    fontSize: 19,
    lineHeight: 32,
  },
  verseNum: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 32,
  },
});
