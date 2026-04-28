import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Linking,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLanguages } from "@/services/manifest";

const logo = require("@/assets/images/icons/android/play_store_512.png");

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];
  const languages = getLanguages();
  const totalTranslations = languages.reduce(
    (sum, l) => sum + l.translations.length,
    0,
  );

  return (
    <ThemedView style={s.container}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <Image source={logo} style={s.logo} />
          <ThemedText style={[s.appName, { color: colors.text }]}>
            OpenBiblia
          </ThemedText>
          <ThemedText style={[s.version, { color: colors.secondaryText }]}>
            Version 1.0.0
          </ThemedText>
        </View>

        <View style={[s.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[s.cardTitle, { color: colors.text }]}>
            About
          </ThemedText>
          <ThemedText style={[s.cardBody, { color: colors.secondaryText }]}>
            OpenBiblia is a free, open-source Bible app that provides access to
            Scripture in {languages.length} languages with {totalTranslations}{" "}
            translations. All Bibles are stored offline on your device for
            reading anytime, anywhere.
          </ThemedText>
        </View>

        <View style={[s.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[s.cardTitle, { color: colors.text }]}>
            Features
          </ThemedText>
          {[
            "Offline reading — no internet needed after download",
            "Multiple translations in dozens of languages",
            "Adjustable text size for comfortable reading",
            "Light and dark theme support",
            "Reading progress tracked automatically",
            "Share and copy individual verses",
          ].map((feature, i) => (
            <View key={i} style={s.featureRow}>
              <ThemedText style={[s.featureDot, { color: colors.tint }]}>
                •
              </ThemedText>
              <ThemedText
                style={[s.featureText, { color: colors.secondaryText }]}
              >
                {feature}
              </ThemedText>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() =>
            Linking.openURL("https://github.com/ekilie/openbiblia")
          }
          style={({ pressed }) => [
            s.linkCard,
            {
              backgroundColor: colors.tint + "12",
              borderColor: colors.tint + "30",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ThemedText style={[s.linkText, { color: colors.tint }]}>
            View on GitHub →
          </ThemedText>
        </Pressable>

        <ThemedText style={[s.footer, { color: colors.secondaryText }]}>
          Made with ♡ for the global community
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    hero: { alignItems: "center", paddingVertical: 32 },
    logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 16 },
    appName: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
    version: { fontSize: 14, marginTop: 4 },
    card: {
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 8,
    },
    cardBody: {
      fontSize: 15,
      lineHeight: 24,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 6,
    },
    featureDot: { fontSize: 16, lineHeight: 22 },
    featureText: { fontSize: 15, lineHeight: 22, flex: 1 },
    linkCard: {
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      marginBottom: 24,
    },
    linkText: { fontSize: 16, fontWeight: "600" },
    footer: {
      textAlign: "center",
      fontSize: 13,
      fontStyle: "italic",
    },
  });
}
