import { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  View,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getVerses, getChapters, getBooks } from "@/services/bible-db";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/services/store";
import type { Verse } from "@/services/types";

const FONT_SIZES = [16, 19, 22, 26];
const LINE_HEIGHTS = [28, 34, 38, 44];

export default function ReaderScreen() {
  const { id, book, chapter } = useLocalSearchParams<{
    id: string;
    book: string;
    chapter: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [allBooks, setAllBooks] = useState<string[]>([]);
  const [showFontControls, setShowFontControls] = useState(false);

  const fontSize = useAppStore((st) => st.fontSize);
  const setFontSize = useAppStore((st) => st.setFontSize);
  const saveReadingPosition = useAppStore((st) => st.saveReadingPosition);

  const chapterNum = parseInt(chapter, 10);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getVerses(id, book, chapterNum),
      getChapters(id, book),
      getBooks(id),
    ]).then(([v, c, b]) => {
      setVerses(v);
      setChapters(c);
      setAllBooks(b);
      setLoading(false);
    });
  }, [id, book, chapterNum]);

  useEffect(() => {
    if (!loading) {
      saveReadingPosition({ translationId: id, book, chapter: chapterNum });
    }
  }, [id, book, chapterNum, loading]);

  const currentChapterIdx = chapters.indexOf(chapterNum);
  const currentBookIdx = allBooks.indexOf(book);
  const hasPrev = currentChapterIdx > 0 || currentBookIdx > 0;
  const hasNext =
    currentChapterIdx < chapters.length - 1 ||
    currentBookIdx < allBooks.length - 1;

  const goToChapter = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev") {
        if (currentChapterIdx > 0) {
          router.replace(
            `/reader/${id}/${book}/${chapters[currentChapterIdx - 1]}`,
          );
        } else if (currentBookIdx > 0) {
          const prevBook = allBooks[currentBookIdx - 1];
          getChapters(id, prevBook).then((prevChapters) => {
            const lastChapter = prevChapters[prevChapters.length - 1];
            router.replace(`/reader/${id}/${prevBook}/${lastChapter}`);
          });
        }
      } else {
        if (currentChapterIdx < chapters.length - 1) {
          router.replace(
            `/reader/${id}/${book}/${chapters[currentChapterIdx + 1]}`,
          );
        } else if (currentBookIdx < allBooks.length - 1) {
          const nextBook = allBooks[currentBookIdx + 1];
          router.replace(`/reader/${id}/${nextBook}/1`);
        }
      }
    },
    [chapters, allBooks, currentChapterIdx, currentBookIdx, id, book, router],
  );

  const handleVerseLongPress = useCallback(
    async (v: Verse) => {
      setSelectedVerse(v.verse);
      const text = `${book} ${chapter}:${v.verse} — ${v.text}`;
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(text);
      } else {
        Share.share({ message: text });
      }
    },
    [book, chapter],
  );

  const textSize = FONT_SIZES[fontSize - 1] ?? 19;
  const lineH = LINE_HEIGHTS[fontSize - 1] ?? 34;

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
      <Stack.Screen
        options={{
          title: `${book} ${chapter}`,
          headerRight: () => (
            <Pressable
              onPress={() => setShowFontControls((v) => !v)}
              hitSlop={8}
              style={s.headerBtn}
            >
              <ThemedText style={[s.headerBtnText, { color: colors.tint }]}>
                Aa
              </ThemedText>
            </Pressable>
          ),
        }}
      />

      {/* Font size controls */}
      {showFontControls && (
        <View
          style={[
            s.fontBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ThemedText style={[s.fontBarLabel, { color: colors.secondaryText }]}>
            Text Size
          </ThemedText>
          <View style={s.fontBarButtons}>
            {[1, 2, 3, 4].map((size) => (
              <Pressable
                key={size}
                onPress={() => setFontSize(size)}
                style={[
                  s.fontSizeBtn,
                  {
                    backgroundColor:
                      fontSize === size ? colors.tint : "transparent",
                    borderColor:
                      fontSize === size ? colors.tint : colors.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    s.fontSizeBtnText,
                    {
                      fontSize: 12 + size * 3,
                      color: fontSize === size ? "#fff" : colors.text,
                    },
                  ]}
                >
                  A
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.headerRow}>
          <View style={[s.headerLine, { backgroundColor: colors.border }]} />
          <ThemedText style={s.heading}>{chapter}</ThemedText>
          <View style={[s.headerLine, { backgroundColor: colors.border }]} />
        </View>

        {verses.map((v) => (
          <Pressable
            key={v.id}
            onLongPress={() => handleVerseLongPress(v)}
            delayLongPress={300}
            style={[
              s.versePressable,
              selectedVerse === v.verse && {
                backgroundColor: colors.tint + "15",
                borderRadius: 8,
              },
            ]}
            onPress={() =>
              setSelectedVerse(selectedVerse === v.verse ? null : v.verse)
            }
          >
            <ThemedText
              style={[
                s.verseNum,
                { fontSize: textSize * 0.63, lineHeight: lineH },
              ]}
            >
              {v.verse}{" "}
            </ThemedText>
            <ThemedText
              style={[
                s.verseText,
                { fontSize: textSize, lineHeight: lineH },
              ]}
            >
              {v.text}{" "}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Chapter navigation bar */}
      <View
        style={[
          s.navBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <Pressable
          onPress={() => hasPrev && goToChapter("prev")}
          style={[s.navBtn, !hasPrev && s.navBtnDisabled]}
          disabled={!hasPrev}
        >
          <ThemedText
            style={[
              s.navBtnText,
              { color: hasPrev ? colors.tint : colors.border },
            ]}
          >
            ‹ Previous
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={s.navCenter}
        >
          <ThemedText style={[s.navCenterText, { color: colors.secondaryText }]}>
            {book} {chapter}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => hasNext && goToChapter("next")}
          style={[s.navBtn, !hasNext && s.navBtnDisabled]}
          disabled={!hasNext}
        >
          <ThemedText
            style={[
              s.navBtnText,
              { color: hasNext ? colors.tint : colors.border },
            ]}
          >
            Next ›
          </ThemedText>
        </Pressable>
      </View>
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
    headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    headerBtnText: { fontSize: 18, fontWeight: "700" },
    fontBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    fontBarLabel: { fontSize: 14, fontWeight: "600" },
    fontBarButtons: { flexDirection: "row", gap: 8 },
    fontSizeBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    fontSizeBtnText: { fontWeight: "700" },
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
    versePressable: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginHorizontal: -4,
    },
    verseText: {
      color: colors.text,
      flex: 1,
    },
    verseNum: {
      fontWeight: "800",
      color: colors.verseNum,
    },
    navBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
    },
    navBtn: {
      flex: 1,
      paddingVertical: 8,
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: {
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
    },
    navCenter: {
      flex: 1,
      alignItems: "center",
    },
    navCenterText: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
}
