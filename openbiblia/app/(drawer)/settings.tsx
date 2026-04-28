import { useEffect } from "react";
import { ScrollView, StyleSheet, Pressable, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, type ThemePreference } from "@/services/store";
import { getTranslation } from "@/services/manifest";
import { deleteTranslation, formatSize } from "@/services/bible-db";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] =
  [
    { value: "system", label: "System", icon: "◐" },
    { value: "light", label: "Light", icon: "☀" },
    { value: "dark", label: "Dark", icon: "☾" },
  ];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const theme = useAppStore((st) => st.theme);
  const setTheme = useAppStore((st) => st.setTheme);
  const defaultBible = useAppStore((st) => st.defaultBible);
  const setDefaultBible = useAppStore((st) => st.setDefaultBible);
  const downloadedIds = useAppStore((st) => st.downloadedIds);
  const removeDownloaded = useAppStore((st) => st.removeDownloaded);
  const refreshDownloaded = useAppStore((st) => st.refreshDownloaded);

  useEffect(() => {
    refreshDownloaded();
  }, []);

  const downloadedBibles = downloadedIds.map((id) => {
    const info = getTranslation(id);
    return {
      id,
      name: info?.translation.name ?? id,
      lang: info?.lang ?? "??",
      size: info?.translation.size ?? 0,
    };
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Translation", `Remove ${name} from device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTranslation(id);
          removeDownloaded(id);
        },
      },
    ]);
  };

  return (
    <ThemedView style={s.container}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme */}
        <ThemedText style={s.sectionTitle}>APPEARANCE</ThemedText>
        <View style={s.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setTheme(opt.value)}
                style={[
                  s.themeOption,
                  {
                    backgroundColor: active ? colors.tint : colors.card,
                    borderColor: active ? colors.tint : colors.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    s.themeIcon,
                    { color: active ? "#fff" : colors.text },
                  ]}
                >
                  {opt.icon}
                </ThemedText>
                <ThemedText
                  style={[
                    s.themeLabel,
                    { color: active ? "#fff" : colors.text },
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Default Bible */}
        <ThemedText style={s.sectionTitle}>DEFAULT BIBLE</ThemedText>
        {downloadedBibles.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[s.emptyText, { color: colors.secondaryText }]}>
              No Bibles downloaded yet. Download one from the Languages screen.
            </ThemedText>
          </View>
        ) : (
          <View style={s.listContainer}>
            {downloadedBibles.map((bible) => {
              const isDefault = defaultBible === bible.id;
              return (
                <Pressable
                  key={bible.id}
                  onPress={() => setDefaultBible(isDefault ? null : bible.id)}
                  style={({ pressed }) => [
                    s.bibleRow,
                    {
                      backgroundColor: isDefault
                        ? colors.tint + "15"
                        : colors.card,
                      borderColor: isDefault
                        ? colors.tint + "40"
                        : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.radio,
                      {
                        borderColor: isDefault
                          ? colors.tint
                          : colors.secondaryText,
                        backgroundColor: isDefault
                          ? colors.tint
                          : "transparent",
                      },
                    ]}
                  >
                    {isDefault && <View style={s.radioInner} />}
                  </View>
                  <View style={s.bibleInfo}>
                    <ThemedText style={[s.bibleName, { color: colors.text }]}>
                      {bible.name.toUpperCase()}
                    </ThemedText>
                    <ThemedText
                      style={[s.bibleMeta, { color: colors.secondaryText }]}
                    >
                      {bible.lang.toUpperCase()} · {formatSize(bible.size)}
                    </ThemedText>
                  </View>
                  {isDefault && (
                    <ThemedText
                      style={[s.defaultBadge, { color: colors.tint }]}
                    >
                      Default
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Downloaded Bibles */}
        <ThemedText style={s.sectionTitle}>
          DOWNLOADED ({downloadedBibles.length})
        </ThemedText>
        {downloadedBibles.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[s.emptyText, { color: colors.secondaryText }]}>
              No downloaded Bibles.
            </ThemedText>
          </View>
        ) : (
          <View style={s.listContainer}>
            {downloadedBibles.map((bible) => (
              <View
                key={bible.id}
                style={[
                  s.downloadedRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[s.downloadedDot, { backgroundColor: colors.success }]}
                />
                <View style={s.bibleInfo}>
                  <ThemedText style={[s.bibleName, { color: colors.text }]}>
                    {bible.name.toUpperCase()}
                  </ThemedText>
                  <ThemedText
                    style={[s.bibleMeta, { color: colors.secondaryText }]}
                  >
                    {bible.lang.toUpperCase()} · {formatSize(bible.size)}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => handleDelete(bible.id, bible.name)}
                  hitSlop={8}
                >
                  <ThemedText style={s.deleteBtn}>✕</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: colors.secondaryText,
      marginBottom: 12,
      marginTop: 24,
      marginLeft: 4,
    },
    themeRow: {
      flexDirection: "row",
      gap: 10,
    },
    themeOption: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 18,
      borderRadius: 14,
      borderWidth: 1,
      gap: 6,
    },
    themeIcon: { fontSize: 24 },
    themeLabel: { fontSize: 13, fontWeight: "600" },
    emptyCard: {
      padding: 20,
      borderRadius: 14,
      alignItems: "center",
    },
    emptyText: { fontSize: 14, textAlign: "center" },
    listContainer: { gap: 8 },
    bibleRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#fff",
    },
    bibleInfo: { flex: 1 },
    bibleName: { fontSize: 15, fontWeight: "600" },
    bibleMeta: { fontSize: 12, marginTop: 2 },
    defaultBadge: { fontSize: 12, fontWeight: "700" },
    downloadedRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
    },
    downloadedDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    deleteBtn: {
      fontSize: 16,
      color: "#D9534F",
      fontWeight: "700",
      paddingLeft: 8,
    },
  });
}
