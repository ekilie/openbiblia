import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getVerses } from "@/services/bible-db";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Verse } from "@/services/types";

export default function ReaderScreen() {
  const { id, book, chapter } = useLocalSearchParams<{
    id: string;
    book: string;
    chapter: string;
  }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  const chapterNum = parseInt(chapter, 10);

  useEffect(() => {
    getVerses(id, book, chapterNum).then((v) => {
      setVerses(v);
      setLoading(false);
    });
  }, [id, book, chapterNum]);

  if (loading) {
    return (
      <ThemedView style={s.center}>
        <Stack.Screen options={{ title: `${book} ${chapter}` }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ title: `${book} ${chapter}` }} />
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.headerRow}>
          <View style={[s.headerLine, { backgroundColor: colors.border }]} />
          <ThemedText style={s.heading}>{chapter}</ThemedText>
          <View style={[s.headerLine, { backgroundColor: colors.border }]} />
        </View>

        <ThemedText style={s.body}>
          {verses.map((v) => (
            <ThemedText key={v.id}>
              <ThemedText style={s.verseNum}>{v.verse} </ThemedText>
              <ThemedText style={s.verseText}>{v.text} </ThemedText>
            </ThemedText>
          ))}
        </ThemedText>
      </ScrollView>
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
      fontSize: 36,
      fontWeight: "800",
      color: colors.tint,
    },
    body: {
      fontSize: 19,
      lineHeight: 34,
      color: colors.text,
    },
    verseText: {
      fontSize: 19,
      lineHeight: 34,
      color: colors.text,
    },
    verseNum: {
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 34,
      color: colors.verseNum,
    },
  });
}
