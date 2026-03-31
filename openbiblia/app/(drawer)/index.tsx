import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getLanguages } from "@/services/manifest";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const logo = require("@/assets/images/icons/android/play_store_512.png");

export default function DashboardScreen() {
  const router = useRouter();
  const languages = getLanguages();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const totalTranslations = languages.reduce(
    (sum, l) => sum + l.translations.length,
    0,
  );
  const totalLanguages = languages.length;

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
        </View>

        {/* Quick Actions */}
        <ThemedText style={[s.sectionTitle, { color: colors.secondaryText }]}>
          EXPLORE
        </ThemedText>

        <View style={s.actionsGrid}>
          {languages.slice(0, 6).map((lang) => (
            <View
              key={lang.lang}
              style={[
                s.actionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
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
            </View>
          ))}
        </View>

        {/* Browse All */}
        <View
          style={[
            s.browseCard,
            { backgroundColor: colors.card, borderColor: colors.border },
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
          <ThemedText
            style={[s.browseArrow, { color: colors.tint }]}
            onPress={() => router.push("/(drawer)/languages")}
          >
            →
          </ThemedText>
        </View>

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
