import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getTranslations } from "@/services/manifest";
import {
  isDownloaded,
  downloadTranslation,
  deleteTranslation,
  formatSize,
} from "@/services/bible-db";
import { getLanguageName } from "@/constants/languages";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { Translation } from "@/services/types";

export default function TranslationsScreen() {
  const { lang } = useLocalSearchParams<{ lang: string }>();
  const router = useRouter();
  const translations = getTranslations(lang);
  const insets = useSafeAreaInsets();
  const cardBg = useThemeColor(
    { light: "#f5f5f5", dark: "#1c1c1e" },
    "background",
  );
  const green = "#34C759";
  const accent = useThemeColor({ light: "#0a7ea4", dark: "#5ac8fa" }, "tint");

  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>(
    {},
  );
  const [downloading, setDownloading] = useState<string | null>(null);

  const checkDownloaded = useCallback(() => {
    const map: Record<string, boolean> = {};
    for (const t of translations) {
      map[t.id] = isDownloaded(t.id);
    }
    setDownloadedMap(map);
  }, [translations]);

  useEffect(() => {
    checkDownloaded();
  }, [checkDownloaded]);

  const handlePress = async (t: Translation) => {
    if (downloadedMap[t.id]) {
      router.push(`/reader/${t.id}`);
      return;
    }
    setDownloading(t.id);
    try {
      await downloadTranslation(t);
      setDownloadedMap((prev) => ({ ...prev, [t.id]: true }));
      router.push(`/reader/${t.id}`);
    } catch (e: any) {
      Alert.alert("Download Failed", e.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleLongPress = (t: Translation) => {
    if (!downloadedMap[t.id]) return;
    Alert.alert("Delete Translation", `Remove ${t.name} from device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTranslation(t.id);
          setDownloadedMap((prev) => ({ ...prev, [t.id]: false }));
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: getLanguageName(lang) }} />
      <FlatList
        data={translations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isLocal = downloadedMap[item.id];
          const isCurrentlyDownloading = downloading === item.id;

          return (
            <Pressable
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
              disabled={isCurrentlyDownloading}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: cardBg, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isLocal ? green : accent },
                ]}
              >
                {isCurrentlyDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.iconText}>
                    {isLocal ? "✓" : "↓"}
                  </ThemedText>
                )}
              </View>
              <View style={styles.cardContent}>
                <ThemedText style={styles.name}>
                  {item.name.toUpperCase()}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {formatSize(item.size)}
                  {isLocal ? " · Downloaded" : " · Tap to download"}
                </ThemedText>
              </View>
              {isLocal && (
                <ThemedText style={[styles.chevron, { color: accent }]}>
                  ›
                </ThemedText>
              )}
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cardContent: { flex: 1 },
  name: { fontSize: 17, fontWeight: "600" },
  meta: { fontSize: 13, opacity: 0.5, marginTop: 3 },
  chevron: { fontSize: 24, fontWeight: "300" },
});
