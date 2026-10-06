import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getTranslation } from "@/services/manifest";
import { bookDisplayName } from "@/services/book-names";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/services/store";

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const bookmarks = useAppStore((st) => st.bookmarks);
  const removeBookmark = useAppStore((st) => st.removeBookmark);
  const clearBookmarks = useAppStore((st) => st.clearBookmarks);

  const handleClear = () => {
    if (bookmarks.length === 0) return;
    Alert.alert("Clear Bookmarks", "Remove all saved verses?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearBookmarks },
    ]);
  };

  if (bookmarks.length === 0) {
    return (
      <ThemedView style={s.container}>
        <View style={s.emptyWrap}>
          <ThemedText style={s.emptyEmoji}>🔖</ThemedText>
          <ThemedText style={[s.emptyTitle, { color: colors.text }]}>
            No bookmarks yet
          </ThemedText>
          <ThemedText style={[s.emptySub, { color: colors.secondaryText }]}>
            Open a chapter, tap a verse, then tap Bookmark to save it here.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={s.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) =>
          `${item.translationId}-${item.book}-${item.chapter}-${item.verse}`
        }
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        ListHeaderComponent={
          <Pressable onPress={handleClear} style={s.clearBtn} hitSlop={8}>
            <ThemedText style={[s.clearText, { color: colors.secondaryText }]}>
              Clear all ({bookmarks.length})
            </ThemedText>
          </Pressable>
        }
        renderItem={({ item }) => {
          const info = getTranslation(item.translationId);
          return (
            <Pressable
              onPress={() =>
                router.push(
                  `/reader/${item.translationId}/${item.book}/${item.chapter}?verse=${item.verse}` as never,
                )
              }
              style={({ pressed }) => [
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={s.cardMain}>
                <ThemedText style={[s.ref, { color: colors.tint }]}>
                  {bookDisplayName(item.book)} {item.chapter}:{item.verse}
                </ThemedText>
                <ThemedText
                  style={[s.text, { color: colors.text }]}
                  numberOfLines={3}
                >
                  {item.text}
                </ThemedText>
                <ThemedText style={[s.meta, { color: colors.secondaryText }]}>
                  {info?.translation.name ?? item.translationId}
                </ThemedText>
              </View>
              <Pressable
                onPress={() =>
                  removeBookmark(
                    item.translationId,
                    item.book,
                    item.chapter,
                    item.verse,
                  )
                }
                hitSlop={12}
              >
                <ThemedText style={s.delete}>✕</ThemedText>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: 16, gap: 10 },
    clearBtn: { alignItems: "flex-end", paddingVertical: 4 },
    clearText: { fontSize: 13, fontWeight: "600" },
    card: {
      flexDirection: "row",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    cardMain: { flex: 1, gap: 4 },
    ref: { fontSize: 13, fontWeight: "800" },
    text: { fontSize: 15, lineHeight: 22 },
    meta: { fontSize: 12, marginTop: 2 },
    delete: { fontSize: 16, color: "#D9534F", fontWeight: "700" },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 8,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: "700" },
    emptySub: { fontSize: 14, textAlign: "center", marginTop: 4 },
  });
}
