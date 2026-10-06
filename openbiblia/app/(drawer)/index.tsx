import { useEffect } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getTranslation } from "@/services/manifest";
import { BOOK_NAMES } from "@/services/book-names";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/services/store";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const readingHistory = useAppStore((st) => st.readingHistory);
  const downloadedIds = useAppStore((st) => st.downloadedIds);
  const defaultBible = useAppStore((st) => st.defaultBible);
  const refreshDownloaded = useAppStore((st) => st.refreshDownloaded);

  useEffect(() => {
    refreshDownloaded();
  }, [refreshDownloaded]);

  const myBibles = downloadedIds
    .map((id) => {
      const info = getTranslation(id);
      if (!info) return null;
      const lastPos = readingHistory.find((r) => r.translationId === id);
      return {
        id,
        name: info.translation.name,
        lang: info.lang,
        lastPos,
        isDefault: defaultBible === id,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const recentReads = readingHistory.slice(0, 5);

  function timeAgo(ts: number): string {
    // eslint-disable-next-line react-hooks/purity -- relative timestamp for display
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const openBible = (bibleId: string) => {
    const lastPos = readingHistory.find((r) => r.translationId === bibleId);
    if (lastPos) {
      router.push(
        `/reader/${bibleId}/${lastPos.book}/${lastPos.chapter}` as never,
      );
    } else {
      router.push(`/reader/${bibleId}` as never);
    }
  };

  return (
    <ThemedView style={s.container}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* MY BIBLES */}
        <ThemedText style={[s.sectionTitle, { color: colors.secondaryText }]}>
          MY BIBLES
        </ThemedText>
        {myBibles.length === 0 ? (
          <Pressable
            onPress={() => router.push("/(drawer)/languages" as never)}
            style={({ pressed }) => [
              s.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ThemedText style={[s.emptyEmoji]}>📖</ThemedText>
            <ThemedText style={[s.emptyTitle, { color: colors.text }]}>
              No Bibles downloaded yet
            </ThemedText>
            <ThemedText
              style={[s.emptySubtitle, { color: colors.secondaryText }]}
            >
              Tap to browse and download a translation
            </ThemedText>
          </Pressable>
        ) : (
          <View style={s.list}>
            {myBibles.map((bible) => (
              <Pressable
                key={bible.id}
                onPress={() => openBible(bible.id)}
                style={({ pressed }) => [
                  s.bibleCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: bible.isDefault
                      ? colors.tint + "60"
                      : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    s.bibleIcon,
                    { backgroundColor: colors.tint + "18" },
                  ]}
                >
                  <ThemedText style={[s.bibleIconText, { color: colors.tint }]}>
                    📖
                  </ThemedText>
                </View>
                <View style={s.bibleInfo}>
                  <ThemedText
                    style={[s.bibleName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {bible.name.toUpperCase()}
                    {bible.isDefault ? " ★" : ""}
                  </ThemedText>
                  <ThemedText
                    style={[s.bibleMeta, { color: colors.secondaryText }]}
                  >
                    {bible.lang.toUpperCase()}
                    {bible.lastPos
                      ? ` · ${BOOK_NAMES[bible.lastPos.book] ?? bible.lastPos.book} ${bible.lastPos.chapter}`
                      : " · Start reading"}
                  </ThemedText>
                </View>
                <ThemedText style={[s.chevron, { color: colors.tint }]}>
                  ›
                </ThemedText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push("/(drawer)/languages" as never)}
              style={({ pressed }) => [
                s.addCard,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={[s.addText, { color: colors.tint }]}>
                + Download another Bible
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* CONTINUE READING */}
        {recentReads.length > 0 && (
          <>
            <ThemedText
              style={[s.sectionTitle, { color: colors.secondaryText }]}
            >
              CONTINUE
            </ThemedText>
            <View style={s.list}>
              {recentReads.map((pos) => {
                const info = getTranslation(pos.translationId);
                const bookName = BOOK_NAMES[pos.book] ?? pos.book;
                return (
                  <Pressable
                    key={`${pos.translationId}-${pos.book}-${pos.chapter}-${pos.timestamp}`}
                    onPress={() =>
                      router.push(
                        `/reader/${pos.translationId}/${pos.book}/${pos.chapter}` as never,
                      )
                    }
                    style={({ pressed }) => [
                      s.recentCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View style={s.recentInfo}>
                      <ThemedText
                        style={[s.recentTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {bookName} {pos.chapter}
                      </ThemedText>
                      <ThemedText
                        style={[s.recentMeta, { color: colors.secondaryText }]}
                      >
                        {info?.translation.name ?? pos.translationId} ·{" "}
                        {timeAgo(pos.timestamp)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[s.chevron, { color: colors.tint }]}>
                      ›
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 12,
      marginLeft: 4,
      marginTop: 8,
    },
    list: { gap: 8, marginBottom: 24 },
    bibleCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    bibleIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    bibleIconText: { fontSize: 20 },
    bibleInfo: { flex: 1 },
    bibleName: { fontSize: 16, fontWeight: "700" },
    bibleMeta: { fontSize: 12, marginTop: 2 },
    chevron: { fontSize: 24, fontWeight: "300" },
    addCard: {
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
    },
    addText: { fontSize: 14, fontWeight: "600" },
    emptyCard: {
      alignItems: "center",
      padding: 32,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 24,
    },
    emptyEmoji: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 17, fontWeight: "700" },
    emptySubtitle: { fontSize: 14, marginTop: 6, textAlign: "center" },
    recentCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    recentInfo: { flex: 1 },
    recentTitle: { fontSize: 16, fontWeight: "600" },
    recentMeta: { fontSize: 12, marginTop: 2 },
  });
}
