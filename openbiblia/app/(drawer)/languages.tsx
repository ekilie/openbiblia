import { useState, useMemo } from "react";
import { FlatList, StyleSheet, Pressable, View, TextInput, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

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
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return languages;
    const q = search.toLowerCase();
    return languages.filter((l) => {
      const name = getLanguageName(l.lang).toLowerCase();
      return name.includes(q) || l.lang.toLowerCase().includes(q);
    });
  }, [languages, search]);

  return (
    <ThemedView style={s.container}>
      <View
        style={[
          s.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ThemedText style={[s.searchIcon, { color: colors.secondaryText }]}>
          ⌕
        </ThemedText>
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Search languages..."
          placeholderTextColor={colors.secondaryText}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.lang}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <ThemedText style={[s.emptyText, { color: colors.secondaryText }]}>
              No languages match "{search}"
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              router.push(`/translations/${item.lang}`);
            }}
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
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      height: 46,
    },
    searchIcon: { fontSize: 20, marginRight: 8 },
    searchInput: {
      flex: 1,
      fontSize: 16,
      height: "100%",
    },
    emptyContainer: { padding: 40, alignItems: "center" },
    emptyText: { fontSize: 15, textAlign: "center" },
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
