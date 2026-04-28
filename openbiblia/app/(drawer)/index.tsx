import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getLanguages, getTranslation } from "@/services/manifest";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, type ReadingPosition } from "@/services/store";

const logo = require("@/assets/images/icons/android/play_store_512.png");

const BOOK_NAMES: Record<string, string> = {
  Gen: "Genesis", Exod: "Exodus", Lev: "Leviticus", Num: "Numbers",
  Deut: "Deuteronomy", Josh: "Joshua", Judg: "Judges", Ruth: "Ruth",
  "1Sam": "1 Samuel", "2Sam": "2 Samuel", "1Kgs": "1 Kings", "2Kgs": "2 Kings",
  "1Chr": "1 Chronicles", "2Chr": "2 Chronicles", Ezra: "Ezra", Neh: "Nehemiah",
  Esth: "Esther", Job: "Job", Ps: "Psalms", Prov: "Proverbs",
  Eccl: "Ecclesiastes", Song: "Song of Solomon", Isa: "Isaiah", Jer: "Jeremiah",
  Lam: "Lamentations", Ezek: "Ezekiel", Dan: "Daniel", Hos: "Hosea",
  Joel: "Joel", Amos: "Amos", Obad: "Obadiah", Jonah: "Jonah",
  Mic: "Micah", Nah: "Nahum", Hab: "Habakkuk", Zeph: "Zephaniah",
  Hag: "Haggai", Zech: "Zechariah", Mal: "Malachi",
  Matt: "Matthew", Mark: "Mark", Luke: "Luke", John: "John",
  Acts: "Acts", Rom: "Romans", "1Cor": "1 Corinthians", "2Cor": "2 Corinthians",
  Gal: "Galatians", Eph: "Ephesians", Phil: "Philippians", Col: "Colossians",
  "1Thess": "1 Thessalonians", "2Thess": "2 Thessalonians",
  "1Tim": "1 Timothy", "2Tim": "2 Timothy", Titus: "Titus", Phlm: "Philemon",
  Heb: "Hebrews", Jas: "James", "1Pet": "1 Peter", "2Pet": "2 Peter",
  "1John": "1 John", "2John": "2 John", "3John": "3 John",
  Jude: "Jude", Rev: "Revelation",
};

export default function DashboardScreen() {
  const router = useRouter();
  const languages = getLanguages();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const readingHistory = useAppStore((st) => st.readingHistory);
  const downloadedIds = useAppStore((st) => st.downloadedIds);

  const totalTranslations = languages.reduce(
    (sum, l) => sum + l.translations.length,
    0,
  );
  const totalLanguages = languages.length;

  const recentReads = readingHistory.slice(0, 3);

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <ThemedView style={s.container}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <Image source={logo} style={s.heroLogo} />
          <ThemedText style={s.heroTitle}>OpenBiblia</ThemedText>
          <ThemedText style={s.heroSubtitle}>
            The Word in every language
          </ThemedText>
        </View>

        {/* Continue Reading */}
        {recentReads.length > 0 && (
          <>
            <ThemedText
              style={[s.sectionTitle, { color: colors.secondaryText }]}
            >
              CONTINUE READING
            </ThemedText>
            <View style={s.recentList}>
              {recentReads.map((pos) => {
                const info = getTranslation(pos.translationId);
                const bookName =
                  BOOK_NAMES[pos.book] ?? pos.book;
                return (
                  <Pressable
                    key={pos.translationId}
                    onPress={() =>
                      router.push(
                        `/reader/${pos.translationId}/${pos.book}/${pos.chapter}`,
                      )
                    }
                    style={({ pressed }) => [
                      s.recentCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.recentIcon,
                        { backgroundColor: colors.tint + "18" },
                      ]}
                    >
                      <ThemedText
                        style={[s.recentIconText, { color: colors.tint }]}
                      >
                        📖
                      </ThemedText>
                    </View>
                    <View style={s.recentInfo}>
                      <ThemedText
                        style={[s.recentTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {bookName} {pos.chapter}
                      </ThemedText>
                      <ThemedText
                        style={[
                          s.recentMeta,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {info?.translation.name ?? pos.translationId} ·{" "}
                        {timeAgo(pos.timestamp)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[s.chevron, { color: colors.tint }]}>
                      ›
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[s.statNumber, { color: colors.tint }]}>
              {totalLanguages}
            </ThemedText>
            <ThemedText style={[s.statLabel, { color: colors.secondaryText }]}>
              Languages
            </ThemedText>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[s.statNumber, { color: colors.tint }]}>
              {totalTranslations}
            </ThemedText>
            <ThemedText style={[s.statLabel, { color: colors.secondaryText }]}>
              Translations
            </ThemedText>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[s.statNumber, { color: colors.tint }]}>
              {downloadedIds.length}
            </ThemedText>
            <ThemedText style={[s.statLabel, { color: colors.secondaryText }]}>
              Downloaded
            </ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <ThemedText style={[s.sectionTitle, { color: colors.secondaryText }]}>
          EXPLORE
        </ThemedText>

        <View style={s.actionsGrid}>
          {languages.slice(0, 6).map((lang) => (
            <Pressable
              key={lang.lang}
              onPress={() => router.push(`/translations/${lang.lang}`)}
              style={({ pressed }) => [
                s.actionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={s.actionCardInner}>
                <ThemedText style={[s.actionEmoji]}>
                  {getFlagEmoji(lang.lang)}
                </ThemedText>
                <ThemedText style={[s.actionTitle, { color: colors.text }]}>
                  {getShortName(lang.lang)}
                </ThemedText>
                <ThemedText
                  style={[s.actionCount, { color: colors.secondaryText }]}
                >
                  {lang.translations.length}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Browse All */}
        <Pressable
          onPress={() => router.push("/(drawer)/languages")}
          style={({ pressed }) => [
            s.browseCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <ThemedText style={[s.browseTitle, { color: colors.text }]}>
              Browse All Languages
            </ThemedText>
            <ThemedText
              style={[s.browseSubtitle, { color: colors.secondaryText }]}
            >
              {totalLanguages} languages · {totalTranslations} translations
            </ThemedText>
          </View>
          <ThemedText style={[s.browseArrow, { color: colors.tint }]}>
            →
          </ThemedText>
        </Pressable>

        {/* Verse of the day placeholder */}
        <View
          style={[
            s.verseCard,
            {
              backgroundColor: colors.tint + "0D",
              borderColor: colors.tint + "25",
            },
          ]}
        >
          <ThemedText style={[s.verseQuote, { color: colors.text }]}>
            "For the word of God is living and active, sharper than any
            two-edged sword..."
          </ThemedText>
          <ThemedText style={[s.verseRef, { color: colors.tint }]}>
            — Hebrews 4:12
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function getFlagEmoji(lang: string): string {
  const flags: Record<string, string> = {
    af: "🇿🇦",
    ar: "🇸🇦",
    bg: "🇧🇬",
    ch: "🇬🇺",
    cs: "🇨🇿",
    da: "🇩🇰",
    de: "🇩🇪",
    en: "🇬🇧",
    es: "🇪🇸",
    eu: "🏴",
    fi: "🇫🇮",
    fr: "🇫🇷",
    gd: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    he: "🇮🇱",
    hr: "🇭🇷",
    ht: "🇭🇹",
    hu: "🇭🇺",
    it: "🇮🇹",
    ko: "🇰🇷",
    la: "🏛️",
    lv: "🇱🇻",
    mi: "🇳🇿",
    no: "🇳🇴",
    pl: "🇵🇱",
    pt: "🇵🇹",
    ro: "🇷🇴",
    ru: "🇷🇺",
    sq: "🇦🇱",
    sv: "🇸🇪",
    sw: "🇹🇿",
    th: "🇹🇭",
    tl: "🇵🇭",
    tr: "🇹🇷",
    vi: "🇻🇳",
    zh: "🇨🇳",
  };
  return flags[lang] ?? "📖";
}

function getShortName(lang: string): string {
  const names: Record<string, string> = {
    af: "Afrikaans",
    ar: "Arabic",
    bg: "Bulgarian",
    ch: "Chamorro",
    cs: "Czech",
    da: "Danish",
    de: "German",
    en: "English",
    es: "Spanish",
    eu: "Basque",
    fi: "Finnish",
    fr: "French",
    gd: "Gaelic",
    he: "Hebrew",
    hr: "Croatian",
    ht: "Creole",
    hu: "Hungarian",
    it: "Italian",
    ko: "Korean",
    la: "Latin",
    lv: "Latvian",
    mi: "Māori",
    no: "Norwegian",
    pl: "Polish",
    pt: "Portuguese",
    ro: "Romanian",
    ru: "Russian",
    sq: "Albanian",
    sv: "Swedish",
    sw: "Swahili",
    th: "Thai",
    tl: "Tagalog",
    tr: "Turkish",
    vi: "Vietnamese",
    zh: "Chinese",
  };
  return names[lang] ?? lang.toUpperCase();
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    hero: {
      alignItems: "center",
      paddingVertical: 32,
    },
    heroLogo: {
      width: 72,
      height: 72,
      borderRadius: 18,
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 34,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.secondaryText,
      marginTop: 6,
      fontStyle: "italic",
    },
    recentList: { gap: 8, marginBottom: 24 },
    recentCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    recentIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    recentIconText: { fontSize: 20 },
    recentInfo: { flex: 1 },
    recentTitle: { fontSize: 16, fontWeight: "600" },
    recentMeta: { fontSize: 12, marginTop: 2 },
    chevron: { fontSize: 24, fontWeight: "300" },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 28,
    },
    statCard: {
      flex: 1,
      padding: 20,
      borderRadius: 16,
      alignItems: "center",
    },
    statNumber: {
      fontSize: 36,
      fontWeight: "800",
    },
    statLabel: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 12,
      marginLeft: 4,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 20,
    },
    actionCard: {
      width: "31%",
      borderRadius: 14,
      borderWidth: 1,
      overflow: "hidden",
    },
    actionCardInner: {
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    actionEmoji: {
      fontSize: 28,
      marginBottom: 6,
    },
    actionTitle: {
      fontSize: 13,
      fontWeight: "600",
    },
    actionCount: {
      fontSize: 11,
      marginTop: 2,
    },
    browseCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
    },
    browseTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    browseSubtitle: {
      fontSize: 13,
      marginTop: 3,
    },
    browseArrow: {
      fontSize: 28,
      fontWeight: "300",
      paddingLeft: 12,
    },
    verseCard: {
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
    },
    verseQuote: {
      fontSize: 17,
      lineHeight: 28,
      fontStyle: "italic",
    },
    verseRef: {
      fontSize: 14,
      fontWeight: "700",
      marginTop: 12,
    },
  });
}
