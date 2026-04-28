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
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const BOOK_NAMES: Record<string, string> = {
  Gen: "Genesis",
  Exod: "Exodus",
  Lev: "Leviticus",
  Num: "Numbers",
  Deut: "Deuteronomy",
  Josh: "Joshua",
  Judg: "Judges",
  Ruth: "Ruth",
  "1Sam": "1 Samuel",
  "2Sam": "2 Samuel",
  "1Kgs": "1 Kings",
  "2Kgs": "2 Kings",
  "1Chr": "1 Chronicles",
  "2Chr": "2 Chronicles",
  Ezra: "Ezra",
  Neh: "Nehemiah",
  Esth: "Esther",
  Job: "Job",
  Ps: "Psalms",
  Prov: "Proverbs",
  Eccl: "Ecclesiastes",
  Song: "Song of Solomon",
  Isa: "Isaiah",
  Jer: "Jeremiah",
  Lam: "Lamentations",
  Ezek: "Ezekiel",
  Dan: "Daniel",
  Hos: "Hosea",
  Joel: "Joel",
  Amos: "Amos",
  Obad: "Obadiah",
  Jonah: "Jonah",
  Mic: "Micah",
  Nah: "Nahum",
  Hab: "Habakkuk",
  Zeph: "Zephaniah",
  Hag: "Haggai",
  Zech: "Zechariah",
  Mal: "Malachi",
  Matt: "Matthew",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Rom: "Romans",
  "1Cor": "1 Corinthians",
  "2Cor": "2 Corinthians",
  Gal: "Galatians",
  Eph: "Ephesians",
  Phil: "Philippians",
  Col: "Colossians",
  "1Thess": "1 Thessalonians",
  "2Thess": "2 Thessalonians",
  "1Tim": "1 Timothy",
  "2Tim": "2 Timothy",
  Titus: "Titus",
  Phlm: "Philemon",
  Heb: "Hebrews",
  Jas: "James",
  "1Pet": "1 Peter",
  "2Pet": "2 Peter",
  "1John": "1 John",
  "2John": "2 John",
  "3John": "3 John",
  Jude: "Jude",
  Rev: "Revelation",
};

const OT_BOOKS = new Set([
  "Gen",
  "Exod",
  "Lev",
  "Num",
  "Deut",
  "Josh",
  "Judg",
  "Ruth",
  "1Sam",
  "2Sam",
  "1Kgs",
  "2Kgs",
  "1Chr",
  "2Chr",
  "Ezra",
  "Neh",
  "Esth",
  "Job",
  "Ps",
  "Prov",
  "Eccl",
  "Song",
  "Isa",
  "Jer",
  "Lam",
  "Ezek",
  "Dan",
  "Hos",
  "Joel",
  "Amos",
  "Obad",
  "Jonah",
  "Mic",
  "Nah",
  "Hab",
  "Zeph",
  "Hag",
  "Zech",
  "Mal",
]);

function bookDisplayName(osisId: string): string {
  return BOOK_NAMES[osisId] ?? osisId;
}

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

  const ot = books.filter((b) => OT_BOOKS.has(b));
  const nt = books.filter((b) => !OT_BOOKS.has(b));
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
