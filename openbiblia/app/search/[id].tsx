import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { searchVerses } from "@/services/bible-db";
import { getTranslation } from "@/services/manifest";
import { bookDisplayName } from "@/services/book-names";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Verse } from "@/services/types";

export default function SearchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const info = getTranslation(id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Verse[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced search status flag
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchVerses(id, trimmed, 50);
        setResults(rows);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, id]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearching(false);
    }
  };

  return (
    <ThemedView style={s.container}>
      <Stack.Screen
        options={{ title: `Search · ${info?.translation.name.toUpperCase() ?? id}` }}
      />
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
          placeholder="Search words in this Bible... (min 2 letters)"
          placeholderTextColor={colors.secondaryText}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          autoFocus
        />
        {searching && <ActivityIndicator size="small" color={colors.tint} />}
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim().length >= 2 && !searching ? (
            <View style={s.emptyWrap}>
              <ThemedText style={[s.emptyText, { color: colors.secondaryText }]}>
                No verses found for {query.trim()}
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(
                `/reader/${id}/${item.book}/${item.chapter}?verse=${item.verse}` as never,
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
            <ThemedText style={[s.ref, { color: colors.tint }]}>
              {bookDisplayName(item.book)} {item.chapter}:{item.verse}
            </ThemedText>
            <ThemedText style={[s.text, { color: colors.text }]} numberOfLines={3}>
              {item.text}
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
      gap: 8,
    },
    searchIcon: { fontSize: 20 },
    searchInput: { flex: 1, fontSize: 16, height: "100%" },
    list: { padding: 16, gap: 10 },
    card: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
    ref: { fontSize: 13, fontWeight: "800" },
    text: { fontSize: 15, lineHeight: 22 },
    emptyWrap: { padding: 32, alignItems: "center" },
    emptyText: { fontSize: 14, textAlign: "center" },
  });
}
