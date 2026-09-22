import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getBooks, getChapters, getVerses } from "@/services/bible-db";
import { bookDisplayName } from "@/services/book-names";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/services/store";
import type { Verse } from "@/services/types";

const FONT_SIZES = [16, 18, 20, 23, 26];
const LINE_HEIGHTS = [27, 30, 34, 39, 45];
const FONT_SIZE_LABELS = ["Small", "Default", "Large", "X-Large", "Huge"];

/** react-native-pager-view requires a native module — fall back to single-page
 *  scrolling on web and in Expo Go, where the module is unavailable. */
const canPager =
  Platform.OS !== "web" && Constants.executionEnvironment !== "storeClient";

interface ReaderPage {
  book: string;
  chapter: number;
}

function pageKey(page: ReaderPage): string {
  return `${page.book}/${page.chapter}`;
}

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

  const chapterNum = parseInt(chapter, 10);
  const routeKey = `${id}/${book}/${chapter}`;

  // Data
  const [allBooks, setAllBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [adjacent, setAdjacent] = useState<{
    prev: ReaderPage | null;
    next: ReaderPage | null;
  }>({ prev: null, next: null });
  const [versesByPage, setVersesByPage] = useState<Record<string, Verse[]>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const dataKey = `${id}/${book}`;
  const loading = loadedKey !== dataKey;

  // Reader state
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  // Settings
  const fontSize = useAppStore((st) => st.fontSize);
  const setFontSize = useAppStore((st) => st.setFontSize);
  const readerFontFamily = useAppStore((st) => st.readerFontFamily);
  const setReaderFontFamily = useAppStore((st) => st.setReaderFontFamily);
  const saveReadingPosition = useAppStore((st) => st.saveReadingPosition);

  const pagerRef = useRef<PagerView | null>(null);
  const speechToken = useRef(0);

  const textSize = FONT_SIZES[fontSize - 1] ?? FONT_SIZES[1];
  const lineH = LINE_HEIGHTS[fontSize - 1] ?? LINE_HEIGHTS[1];
  const bodyFont = readerFontFamily === "serif" ? "Lora_400Regular" : undefined;

  // Load books, chapters, and the neighboring book's edge chapter so swiping
  // can flow seamlessly across book boundaries.
  useEffect(() => {
    let alive = true;
    Promise.all([getBooks(id), getChapters(id, book)])
      .then(async ([books, chs]) => {
        const bookIdx = books.indexOf(book);
        const prevBook = bookIdx > 0 ? books[bookIdx - 1] : null;
        const nextBook =
          bookIdx >= 0 && bookIdx < books.length - 1
            ? books[bookIdx + 1]
            : null;
        const [prevChs, nextChs] = await Promise.all([
          prevBook ? getChapters(id, prevBook) : Promise.resolve(null),
          nextBook ? getChapters(id, nextBook) : Promise.resolve(null),
        ]);
        if (!alive) return;
        const adjPrev =
          prevBook && prevChs?.length
            ? { book: prevBook, chapter: prevChs[prevChs.length - 1] }
            : null;
        const adjNext =
          nextBook && nextChs?.length
            ? { book: nextBook, chapter: nextChs[0] }
            : null;
        const chIdx = chs.indexOf(chapterNum);
        const initial = (adjPrev ? 1 : 0) + Math.max(0, chIdx);
        setAllBooks(books);
        setChapters(chs);
        setAdjacent({ prev: adjPrev, next: adjNext });
        setPageIndex(initial);
        setSelectedVerse(null);
        speechToken.current += 1;
        Speech.stop();
        setSpeaking(false);
        setActiveVerse(null);
        setLoadedKey(dataKey);
      })
      .catch(() => {
        if (alive) setLoadedKey(dataKey);
      });
    return () => {
      alive = false;
    };
  }, [id, book, chapterNum, dataKey]);

  // Pages laid out left-to-right: [prev book's last chapter] ... [next book's first chapter]
  const pages = useMemo<ReaderPage[]>(() => {
    const list: ReaderPage[] = [];
    if (adjacent.prev) list.push(adjacent.prev);
    for (const c of chapters) list.push({ book, chapter: c });
    if (adjacent.next) list.push(adjacent.next);
    return list;
  }, [adjacent, chapters, book]);

  const initialIndex = useMemo(() => {
    const idx = chapters.indexOf(chapterNum);
    return (adjacent.prev ? 1 : 0) + Math.max(0, idx);
  }, [chapters, chapterNum, adjacent.prev]);

  const currentPage = useMemo(
    () => pages[pageIndex] ?? { book, chapter: chapterNum },
    [pages, pageIndex, book, chapterNum],
  );
  const currentKey = pageKey(currentPage);
  const currentVerses = versesByPage[currentKey] ?? [];
  const reportVerses = useCallback((page: ReaderPage, verses: Verse[]) => {
    const key = pageKey(page);
    setVersesByPage((prev) => (prev[key] === verses ? prev : { ...prev, [key]: verses }));
  }, []);

  // Save reading position for the visible page.
  useEffect(() => {
    if (!loading && pages.length > 0) {
      saveReadingPosition({
        translationId: id,
        book: currentPage.book,
        chapter: currentPage.chapter,
      });
    }
  }, [id, loading, pages.length, currentPage, saveReadingPosition]);

  // ---- Speech ----
  const stopSpeech = useCallback(() => {
    speechToken.current += 1;
    Speech.stop();
    setSpeaking(false);
    setActiveVerse(null);
  }, []);

  const speakFrom = useCallback(
    (startVerse: number) => {
      const verses = versesByPage[currentKey];
      if (!verses || verses.length === 0) return;
      const startIdx = Math.max(
        0,
        Math.min(startVerse > 0 ? verses.findIndex((v) => v.verse === startVerse) : 0, verses.length - 1),
      );
      const token = speechToken.current + 1;
      speechToken.current = token;
      Speech.stop();
      setSpeaking(true);

      const speakNext = (idx: number) => {
        if (speechToken.current !== token) return;
        if (idx >= verses.length) {
          stopSpeech();
          return;
        }
        setActiveVerse(verses[idx].verse);
        Speech.speak(verses[idx].text, {
          onDone: () => speakNext(idx + 1),
          onStopped: () => {
            if (speechToken.current === token) stopSpeech();
          },
          onError: () => {
            if (speechToken.current === token) stopSpeech();
          },
        });
      };
      speakNext(startIdx);
    },
    [versesByPage, currentKey, stopSpeech],
  );

  const speakFromVerse = useCallback(
    (verse: number) => speakFrom(verse),
    [speakFrom],
  );

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // ---- Page navigation ----
  const handlePageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const pos = e.nativeEvent.position;
      if (pos === pageIndex) return;
      const page = pages[pos];
      if (!page) return;
      if (pos === 0 && adjacent.prev) {
        router.replace(`/reader/${id}/${page.book}/${page.chapter}`);
        return;
      }
      if (pos === pages.length - 1 && adjacent.next) {
        router.replace(`/reader/${id}/${page.book}/${page.chapter}`);
        return;
      }
      setPageIndex(pos);
      setSelectedVerse(null);
      if (speaking) stopSpeech();
    },
    [pageIndex, pages, adjacent, id, router, speaking, stopSpeech],
  );

  const goToPage = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= pages.length) return;
      if (canPager && pagerRef.current) {
        pagerRef.current.setPage(idx);
      } else {
        const page = pages[idx];
        router.replace(`/reader/${id}/${page.book}/${page.chapter}`);
      }
    },
    [pages, id, router],
  );

  const currentBookIdx = allBooks.indexOf(currentPage.book);
  const canPrev =
    pageIndex > 0 || (adjacent.prev !== null && currentBookIdx > 0);
  const canNext =
    pageIndex < pages.length - 1 ||
    (adjacent.next !== null && currentBookIdx < allBooks.length - 1);

  // Pure router navigation (no pager ref) shared by the swipe gestures and
  // used by the fallback (web / Expo Go) path.
  const replaceTo = useCallback(
    (idx: number) => {
      const page = pages[idx];
      if (page) router.replace(`/reader/${id}/${page.book}/${page.chapter}`);
    },
    [pages, id, router],
  );

  const beyondPrev = useCallback(() => {
    if (currentBookIdx > 0) {
      const prevBook = allBooks[currentBookIdx - 1];
      getChapters(id, prevBook).then((chs) => {
        router.replace(`/reader/${id}/${prevBook}/${chs[chs.length - 1]}`);
      });
    }
  }, [currentBookIdx, allBooks, id, router]);

  const beyondNext = useCallback(() => {
    if (currentBookIdx < allBooks.length - 1) {
      const nextBook = allBooks[currentBookIdx + 1];
      router.replace(`/reader/${id}/${nextBook}/1`);
    }
  }, [currentBookIdx, allBooks, id, router]);

  const goPrev = useCallback(() => {
    if (pageIndex > 0) goToPage(pageIndex - 1);
    else beyondPrev();
  }, [pageIndex, goToPage, beyondPrev]);

  const goNext = useCallback(() => {
    if (pageIndex < pages.length - 1) goToPage(pageIndex + 1);
    else beyondNext();
  }, [pageIndex, pages.length, goToPage, beyondNext]);

  const swipePrev = useCallback(() => {
    if (pageIndex > 0) replaceTo(pageIndex - 1);
    else beyondPrev();
  }, [pageIndex, replaceTo, beyondPrev]);

  const swipeNext = useCallback(() => {
    if (pageIndex < pages.length - 1) replaceTo(pageIndex + 1);
    else beyondNext();
  }, [pageIndex, pages.length, replaceTo, beyondNext]);

  // Horizontal swipe navigation for web / Expo Go, where the pager module is
  // unavailable (native builds swipe natively through PagerView).
  const swipeGesture = useMemo(
    () =>
      Gesture.Race(
        Gesture.Pan()
          .activeOffsetX(24)
          .failOffsetY([-18, 18])
          .onEnd((e) => {
            if (e.translationX > 72) swipePrev();
          }),
        Gesture.Pan()
          .activeOffsetX(-24)
          .failOffsetY([-18, 18])
          .onEnd((e) => {
            if (e.translationX < -72) swipeNext();
          }),
      ),
    [swipePrev, swipeNext],
  );

  // ---- Verse actions ----
  const selectVerse = useCallback((verseNum: number | null) => {
    setSelectedVerse(verseNum);
    if (verseNum !== null && Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  }, []);

  const selectedVerseObj =
    currentVerses.find((v) => v.verse === selectedVerse) ?? null;

  const copyVerse = useCallback(
    async (v: Verse) => {
      if (!v) return;
      const text = `${bookDisplayName(currentPage.book)} ${currentPage.chapter}:${v.verse} ${v.text}`;
      await Clipboard.setStringAsync(text);
      setSelectedVerse(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [currentPage],
  );

  const shareVerse = useCallback(
    async (v: Verse) => {
      if (!v) return;
      const text = `${bookDisplayName(currentPage.book)} ${currentPage.chapter}:${v.verse} ${v.text}`;
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(text);
      } else {
        await Share.share({ message: text });
      }
      setSelectedVerse(null);
    },
    [currentPage],
  );

  const currentVersesLoaded = currentVerses.length > 0;

  if (loading || pages.length === 0) {
    return (
      <ThemedView style={s.center}>
        <Stack.Screen options={{ title: `${bookDisplayName(book)} ${chapter}` }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  const contentProps = {
    id,
    textSize,
    lineH,
    bodyFont,
    selectedVerse,
    activeVerse,
    onSelectVerse: selectVerse,
    onVerses: reportVerses,
  };

  return (
    <ThemedView style={s.container}>
      <Stack.Screen
        options={{
          title: `${bookDisplayName(currentPage.book)} ${currentPage.chapter}`,
          headerRight: () => (
            <View style={s.headerActions}>
              <Pressable
                onPress={() => (speaking ? stopSpeech() : speakFrom(0))}
                hitSlop={8}
                style={s.headerBtn}
                disabled={!currentVersesLoaded && !speaking}
              >
                <MaterialIcons
                  name={speaking ? "stop-circle" : "play-circle-outline"}
                  size={26}
                  color={speaking || currentVersesLoaded ? colors.tint : colors.border}
                />
              </Pressable>
              <Pressable
                onPress={() => setShowPanel((v) => !v)}
                hitSlop={8}
                style={s.headerBtn}
              >
                <ThemedText style={[s.headerBtnText, { color: colors.tint }]}>
                  Aa
                </ThemedText>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Reading settings */}
      {showPanel && (
        <View
          style={[
            s.panel,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <View style={s.panelRow}>
            <ThemedText style={[s.panelLabel, { color: colors.secondaryText }]}>
              Text Size
            </ThemedText>
            <View style={s.stepper}>
              <Pressable
                onPress={() => setFontSize(Math.max(1, fontSize - 1))}
                disabled={fontSize <= 1}
                style={[
                  s.stepperBtn,
                  { borderColor: colors.border },
                  fontSize <= 1 && s.stepperBtnDisabled,
                ]}
              >
                <ThemedText style={[s.stepperBtnText, { color: colors.text }]}>
                  A−
                </ThemedText>
              </Pressable>
              <ThemedText style={[s.stepperValue, { color: colors.secondaryText }]}>
                {FONT_SIZE_LABELS[fontSize - 1]}
              </ThemedText>
              <Pressable
                onPress={() => setFontSize(Math.min(FONT_SIZES.length, fontSize + 1))}
                disabled={fontSize >= FONT_SIZES.length}
                style={[
                  s.stepperBtn,
                  { borderColor: colors.border },
                  fontSize >= FONT_SIZES.length && s.stepperBtnDisabled,
                ]}
              >
                <ThemedText style={[s.stepperBtnText, { color: colors.text }]}>
                  A+
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={s.panelRow}>
            <ThemedText style={[s.panelLabel, { color: colors.secondaryText }]}>
              Reading Font
            </ThemedText>
            <View style={s.segmented}>
              {(["serif", "sans"] as const).map((family) => (
                <Pressable
                  key={family}
                  onPress={() => setReaderFontFamily(family)}
                  style={[
                    s.segment,
                    {
                      backgroundColor:
                        readerFontFamily === family ? colors.tint : "transparent",
                      borderColor:
                        readerFontFamily === family ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      s.segmentText,
                      {
                        color:
                          readerFontFamily === family ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    {family === "serif" ? "Serif" : "Sans"}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Chapter content */}
      <View style={s.contentArea}>
        {canPager ? (
          <PagerView
            ref={pagerRef}
            key={routeKey}
            style={s.pager}
            initialPage={initialIndex}
            onPageSelected={handlePageSelected}
          >
            {pages.map((page) => (
              <ChapterContent
                key={pageKey(page)}
                page={page}
                {...contentProps}
              />
            ))}
          </PagerView>
        ) : (
          <GestureDetector gesture={swipeGesture}>
            <View style={{ flex: 1 }}>
              <ChapterContent page={currentPage} {...contentProps} />
            </View>
          </GestureDetector>
        )}
      </View>

      {/* Selected verse actions */}
      {selectedVerseObj && (
        <View
          style={[
            s.actionBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: 8,
            },
          ]}
        >
          <Pressable style={s.actionBtn} onPress={() => copyVerse(selectedVerseObj)}>
            <MaterialIcons name="content-copy" size={20} color={colors.tint} />
            <ThemedText style={[s.actionLabel, { color: colors.text }]}>
              Copy
            </ThemedText>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={() => shareVerse(selectedVerseObj)}>
            <MaterialIcons name="share" size={20} color={colors.tint} />
            <ThemedText style={[s.actionLabel, { color: colors.text }]}>
              Share
            </ThemedText>
          </Pressable>
          <Pressable
            style={s.actionBtn}
            onPress={() => speakFromVerse(selectedVerseObj.verse)}
          >
            <MaterialIcons name="volume-up" size={20} color={colors.tint} />
            <ThemedText style={[s.actionLabel, { color: colors.text }]}>
              Listen
            </ThemedText>
          </Pressable>
          <Pressable
            style={s.actionBtn}
            onPress={() => selectVerse(null)}
            hitSlop={8}
          >
            <MaterialIcons name="close" size={22} color={colors.secondaryText} />
          </Pressable>
        </View>
      )}

      {/* Chapter navigation */}
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
          onPress={goPrev}
          style={[s.navBtn, !canPrev && s.navBtnDisabled]}
          disabled={!canPrev}
        >
          <ThemedText style={[s.navBtnText, { color: canPrev ? colors.tint : colors.border }]}>
            ‹ Previous
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => router.back()} style={s.navCenter}>
          <ThemedText style={[s.navCenterText, { color: colors.secondaryText }]}>
            {bookDisplayName(currentPage.book)} {currentPage.chapter}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={goNext}
          style={[s.navBtn, !canNext && s.navBtnDisabled]}
          disabled={!canNext}
        >
          <ThemedText style={[s.navBtnText, { color: canNext ? colors.tint : colors.border }]}>
            Next ›
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

interface ChapterContentProps {
  page: ReaderPage;
  id: string;
  textSize: number;
  lineH: number;
  bodyFont?: string;
  selectedVerse: number | null;
  activeVerse: number | null;
  onSelectVerse: (verse: number | null) => void;
  onVerses: (page: ReaderPage, verses: Verse[]) => void;
}

/** Fetches and renders a single chapter's verses. */
function ChapterContent({
  page,
  id,
  textSize,
  lineH,
  bodyFont,
  selectedVerse,
  activeVerse,
  onSelectVerse,
  onVerses,
}: ChapterContentProps) {
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getVerses(id, page.book, page.chapter).then((v) => {
      if (!alive) return;
      setVerses(v);
      setLoading(false);
      onVerses(page, v);
    });
    return () => {
      alive = false;
    };
  }, [id, page, onVerses]);

  return (
    <View style={s.page}>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.headerRow}>
          <View style={[s.headerLine, { backgroundColor: colors.border }]} />
          <View style={s.headingBlock}>
            <ThemedText style={[s.bookName, { color: colors.secondaryText }]}>
              {bookDisplayName(page.book)}
            </ThemedText>
            <ThemedText
              style={[
                s.heading,
                { color: colors.tint, fontFamily: bodyFont ? "Lora_700Bold" : undefined },
              ]}
            >
              {page.chapter}
            </ThemedText>
          </View>
          <View style={[s.headerLine, { backgroundColor: colors.border }]} />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={s.pageSpinner}
          />
        ) : (
          verses.map((v) => {
            const isSelected = selectedVerse === v.verse;
            const isActive = activeVerse === v.verse;
            return (
              <Pressable
                key={v.id}
                onPress={() => onSelectVerse(isSelected ? null : v.verse)}
                onLongPress={() => onSelectVerse(v.verse)}
                delayLongPress={300}
                style={[
                  s.versePressable,
                  (isSelected || isActive) && {
                    backgroundColor: isActive ? colors.tint + "2B" : colors.tint + "15",
                    borderRadius: 8,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    s.verseNum,
                    {
                      fontSize: Math.round(textSize * 0.6),
                      lineHeight: lineH,
                      fontFamily: bodyFont ? "Lora_500Medium" : undefined,
                    },
                  ]}
                >
                  {v.verse}{" "}
                </ThemedText>
                <ThemedText
                  style={[
                    s.verseText,
                    {
                      fontSize: textSize,
                      lineHeight: lineH,
                      fontFamily: bodyFont,
                    },
                  ]}
                >
                  {v.text}{" "}
                </ThemedText>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
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
    pager: { flex: 1, backgroundColor: colors.background },
    page: { flex: 1, backgroundColor: colors.background },
    contentArea: { flex: 1, backgroundColor: colors.background },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 4,
    },
    headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    headerBtnText: { fontSize: 17, fontWeight: "700" },
    panel: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      gap: 10,
    },
    panelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    panelLabel: { fontSize: 14, fontWeight: "600" },
    stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepperBtn: {
      minWidth: 44,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
    },
    stepperBtnDisabled: { opacity: 0.35 },
    stepperBtnText: { fontSize: 15, fontWeight: "700" },
    stepperValue: { fontSize: 13, fontWeight: "600", minWidth: 64, textAlign: "center" },
    segmented: { flexDirection: "row", gap: 8 },
    segment: {
      paddingHorizontal: 16,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    segmentText: { fontSize: 14, fontWeight: "600" },
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
    headingBlock: { alignItems: "center", gap: 2 },
    bookName: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    heading: {
      fontSize: 40,
      fontWeight: "800",
      lineHeight: 44,
    },
    pageSpinner: { marginTop: 48 },
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
      letterSpacing: 0.1,
    },
    verseNum: {
      fontWeight: "700",
      color: colors.verseNum,
    },
    actionBar: {
      marginHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    actionBtn: { alignItems: "center", gap: 2, paddingHorizontal: 12, paddingVertical: 4 },
    actionLabel: { fontSize: 12, fontWeight: "600" },
    navBar: {
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