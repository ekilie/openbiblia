import { useEffect, useState } from "react";
import {
  SectionList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  View,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getBooks } from "@/services/bible-db";
import { getTranslation } from "@/services/manifest";
import { bookDisplayName, isOldTestament } from "@/services/book-names";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function BooksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const [books, setBooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const info = getTranslation(id);

  useEffect(() => {
    getBooks(id).then((b) => {
      setBooks(b);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={s.center}>
        <Stack.Screen
          options={{ title: info?.translation.name.toUpperCase() ?? id }}
        />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  const ot = books.filter((b) => isOldTestament(b));
  const nt = books.filter((b) => !isOldTestament(b));
  const sections = [
    ...(ot.length ? [{ title: "Old Testament", data: ot }] : []),
    ...(nt.length ? [{ title: "New Testament", data: nt }] : []),
  ];

  return (
    <ThemedView style={s.container}>
      <Stack.Screen
        options={{ title: info?.translation.name.toUpperCase() ?? id }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <ThemedText style={s.sectionHeader}>{section.title}</ThemedText>
        )}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              router.push(`/reader/${id}/${item}`);
            }}
            style={({ pressed }) => [s.card, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={s.numBadge}>
              <ThemedText style={s.numText}>{index + 1}</ThemedText>
            </View>
            <ThemedText style={s.bookName}>{bookDisplayName(item)}</ThemedText>
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
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    list: { padding: 16, gap: 6 },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      color: colors.secondaryText,
      letterSpacing: 1.5,
      marginTop: 16,
      marginBottom: 6,
      marginLeft: 4,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 12,
      gap: 12,
      backgroundColor: colors.card,
    },
    numBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.tint + "18",
    },
    numText: { fontSize: 14, fontWeight: "700", color: colors.tint },
    bookName: { flex: 1, fontSize: 17, fontWeight: "500", color: colors.text },
    chevron: { fontSize: 24, fontWeight: "300" },
  });
}
