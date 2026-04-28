import { FlatList, StyleSheet, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getLanguages } from "@/services/manifest";
import { getLanguageName } from "@/constants/languages";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LanguagesScreen() {
  const router = useRouter();
  const languages = getLanguages();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={s.container}>
      <FlatList
        data={languages}
        keyExtractor={(item) => item.lang}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/translations/${item.lang}`)}
            style={({ pressed }) => [s.card, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={s.badge}>
              <ThemedText style={s.badgeText}>
                {item.lang.toUpperCase()}
              </ThemedText>
            </View>
            <View style={s.cardContent}>
              <ThemedText style={s.langName}>
                {getLanguageName(item.lang)}
              </ThemedText>
              <ThemedText style={[s.count, { color: colors.secondaryText }]}>
                {item.translations.length} translation
                {item.translations.length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
            <ThemedText style={[s.chevron, { color: colors.tint }]}>
              ›
            </ThemedText>
          </Pressable>
        )}
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
    badge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    badgeText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "800",
    },
    cardContent: { flex: 1 },
    langName: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    count: {
      fontSize: 13,
      marginTop: 3,
    },
    chevron: {
      fontSize: 24,
      fontWeight: "300",
    },
  });
}
