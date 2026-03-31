import { FlatList, StyleSheet, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getLanguages } from "@/services/manifest";
import { getLanguageName } from "@/constants/languages";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function LanguagesScreen() {
  const router = useRouter();
  const languages = getLanguages();
  const insets = useSafeAreaInsets();
  const cardBg = useThemeColor({light: '#f5f5f5', dark: '#1c1c1e'}, 'background');
  const accent = useThemeColor({light: '#0a7ea4', dark: '#5ac8fa'}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={languages}
        keyExtractor={(item) => item.lang}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/translations/${item.lang}`)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: cardBg, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <ThemedText style={styles.badgeText}>
                {item.lang.toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.cardContent}>
              <ThemedText style={styles.langName}>
                {getLanguageName(item.lang)}
              </ThemedText>
              <ThemedText style={styles.count}>
                {item.translations.length} translation{item.translations.length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
            <ThemedText style={[styles.chevron, { color: accent }]}>›</ThemedText>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    gap: 14,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  cardContent: {
    flex: 1,
  },
  langName: {
    fontSize: 17,
    fontWeight: "600",
  },
  count: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 3,
  },
  chevron: {
    fontSize: 24,
    fontWeight: "300",
  },
});
