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
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/services/store";
import type { Translation } from "@/services/types";

export default function TranslationsScreen() {
  const { lang } = useLocalSearchParams<{ lang: string }>();
  const router = useRouter();
  const translations = getTranslations(lang);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const addDownloaded = useAppStore((st) => st.addDownloaded);
  const removeDownloadedFromStore = useAppStore((st) => st.removeDownloaded);

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
      addDownloaded(t.id);
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
          removeDownloadedFromStore(t.id);
        },
      },
    ]);
  };

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ title: getLanguageName(lang) }} />
      <FlatList
        data={translations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isLocal = downloadedMap[item.id];
          const isCurrentlyDownloading = downloading === item.id;

          return (
            <Pressable
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
              disabled={isCurrentlyDownloading}
              style={({ pressed }) => [s.card, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View
                style={[
                  s.iconCircle,
                  {
                    backgroundColor: isLocal ? colors.success : colors.tint,
                  },
                ]}
              >
                {isCurrentlyDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={s.iconText}>
                    {isLocal ? "✓" : "↓"}
                  </ThemedText>
                )}
              </View>
              <View style={s.cardContent}>
                <ThemedText style={s.name}>
                  {item.name.toUpperCase()}
                </ThemedText>
                <ThemedText style={s.meta}>
                  {formatSize(item.size)}
                  {isLocal ? " · Downloaded" : " · Tap to download"}
                </ThemedText>
              </View>
              {isLocal && (
                <ThemedText style={[s.chevron, { color: colors.tint }]}>
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
      gap: 14,
      backgroundColor: colors.card,
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
    name: { fontSize: 17, fontWeight: "600", color: colors.text },
    meta: { fontSize: 13, color: colors.secondaryText, marginTop: 3 },
    chevron: { fontSize: 24, fontWeight: "300" },
  });
}
