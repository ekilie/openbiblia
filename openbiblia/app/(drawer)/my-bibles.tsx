import { useEffect } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getTranslation } from "@/services/manifest";
import { BOOK_NAMES } from "@/services/book-names";
import { deleteTranslation, formatSize } from "@/services/bible-db";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/services/store";

export default function MyBiblesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const downloadedIds = useAppStore((st) => st.downloadedIds);
  const defaultBible = useAppStore((st) => st.defaultBible);
  const setDefaultBible = useAppStore((st) => st.setDefaultBible);
  const removeDownloaded = useAppStore((st) => st.removeDownloaded);
  const refreshDownloaded = useAppStore((st) => st.refreshDownloaded);
  const readingHistory = useAppStore((st) => st.readingHistory);

  useEffect(() => {
    refreshDownloaded();
  }, [refreshDownloaded]);

  const bibles = downloadedIds
    .map((id) => {
      const info = getTranslation(id);
      if (!info) return null;
      return {
        id,
        name: info.translation.name,
        lang: info.lang,
        size: info.translation.size,
        lastPos: readingHistory.find((r) => r.translationId === id),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const openBible = (bibleId: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const lastPos = readingHistory.find((r) => r.translationId === bibleId);
    if (lastPos) {
      router.push(`/reader/${bibleId}/${lastPos.book}/${lastPos.chapter}` as never);
    } else {
      router.push(`/reader/${bibleId}` as never);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Translation", `Remove ${name} from device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTranslation(id);
          removeDownloaded(id);
        },
      },
    ]);
  };

  if (bibles.length === 0) {
    return (
      <ThemedView style={s.container}>
        <View style={s.emptyWrap}>
          <ThemedText style={s.emptyEmoji}>📖</ThemedText>
          <ThemedText style={[s.emptyTitle, { color: colors.text }]}>
            No Bibles downloaded
          </ThemedText>
          <Pressable
            onPress={() => router.push("/(drawer)/languages" as never)}
            style={[s.browseBtn, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={s.browseBtnText}>Browse Bibles</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={s.container}>
      <FlatList
        data={bibles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        renderItem={({ item }) => {
          const isDefault = defaultBible === item.id;
          return (
            <Pressable
              onPress={() => openBible(item.id)}
              style={({ pressed }) => [
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDefault ? colors.tint + "60" : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={s.cardMain}>
                <ThemedText style={[s.name, { color: colors.text }]} numberOfLines={1}>
                  {item.name.toUpperCase()}
                  {isDefault ? " ★" : ""}
                </ThemedText>
                <ThemedText style={[s.meta, { color: colors.secondaryText }]}>
                  {item.lang.toUpperCase()} · {formatSize(item.size)}
                  {item.lastPos
                    ? ` · ${BOOK_NAMES[item.lastPos.book] ?? item.lastPos.book} ${item.lastPos.chapter}`
                    : ""}
                </ThemedText>
                <View style={s.rowActions}>
                  <Pressable
                    onPress={() => {
                      setDefaultBible(isDefault ? null : item.id);
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                    hitSlop={8}
                  >
                    <ThemedText style={[s.action, { color: colors.tint }]}>
                      {isDefault ? "Default ✓" : "Set default"}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/search/${item.id}` as never)}
                    hitSlop={8}
                  >
                    <ThemedText style={[s.action, { color: colors.tint }]}>
                      Search
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item.id, item.name)}
                    hitSlop={8}
                  >
                    <ThemedText style={[s.action, s.delete]}>Delete</ThemedText>
                  </Pressable>
                </View>
              </View>
              <ThemedText style={[s.chevron, { color: colors.tint }]}>›</ThemedText>
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
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    cardMain: { flex: 1, gap: 2 },
    name: { fontSize: 16, fontWeight: "700" },
    meta: { fontSize: 12, marginTop: 2 },
    rowActions: { flexDirection: "row", gap: 16, marginTop: 8 },
    action: { fontSize: 13, fontWeight: "600" },
    delete: { color: "#D9534F", fontSize: 13, fontWeight: "600" },
    chevron: { fontSize: 24, fontWeight: "300" },
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: "700" },
    browseBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    browseBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });
}
