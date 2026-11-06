import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  commentaryFile,
  deleteCommentary,
  downloadCommentary,
  formatCommentarySize,
  getCommentaries,
  getCommentaryTitle,
  readCommentary,
  shareCommentary,
} from "@/services/commentaries";
import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Commentary, Testament } from "@/services/types";

const commentaries = getCommentaries();

const SECTIONS: { key: Testament; title: string }[] = [
  { key: "old", title: "Old Testament" },
  { key: "new", title: "New Testament" },
  { key: "additional", title: "Additional" },
];

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.selectionAsync();
  }
}

export default function CommentariesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const s = getStyles(colorScheme);
  const colors = Colors[colorScheme];

  const [search, setSearch] = useState("");
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});
  const [localSizes, setLocalSizes] = useState<Record<string, number>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  const refreshDownloaded = useCallback(() => {
    const nextDownloaded: Record<string, boolean> = {};
    const nextSizes: Record<string, number> = {};

    for (const commentary of commentaries) {
      const file = commentaryFile(commentary.name);
      nextDownloaded[commentary.name] = file.exists;
      if (file.exists) {
        nextSizes[commentary.name] = file.size;
      }
    }

    setDownloaded(nextDownloaded);
    setLocalSizes(nextSizes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDownloaded();
    }, [refreshDownloaded]),
  );

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? commentaries.filter(
          (commentary) =>
            getCommentaryTitle(commentary.name).toLowerCase().includes(q) ||
            commentary.name.toLowerCase().includes(q),
        )
      : commentaries;

    return SECTIONS.map((section) => ({
      title: section.title,
      data: filtered.filter(
        (commentary) => (commentary.testament ?? "additional") === section.key,
      ),
    })).filter((section) => section.data.length > 0);
  }, [search]);

  const downloadedCount = useMemo(
    () => commentaries.filter((c) => downloaded[c.name]).length,
    [downloaded],
  );

  const handleDownload = async (commentary: Commentary) => {
    if (downloading) return;

    haptic();
    setDownloading(commentary.name);
    try {
      await downloadCommentary(commentary);
      const file = commentaryFile(commentary.name);
      setDownloaded((prev) => ({ ...prev, [commentary.name]: true }));
      setLocalSizes((prev) => ({ ...prev, [commentary.name]: file.size }));
    } catch (error) {
      Alert.alert(
        "Download failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setDownloading(null);
    }
  };

  const handleRead = async (commentary: Commentary) => {
    haptic();
    try {
      await readCommentary(commentary.name);
    } catch (error) {
      Alert.alert(
        "Unable to open",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleShare = async (commentary: Commentary) => {
    haptic();
    try {
      await shareCommentary(commentary.name);
    } catch (error) {
      Alert.alert(
        "Unable to share",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleDelete = (commentary: Commentary) => {
    Alert.alert(
      "Delete Commentary",
      `Remove ${getCommentaryTitle(commentary.name)} from device?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCommentary(commentary.name);
            setDownloaded((prev) => ({ ...prev, [commentary.name]: false }));
            setLocalSizes((prev) => {
              const next = { ...prev };
              delete next[commentary.name];
              return next;
            });
          },
        },
      ],
    );
  };

  const handlePress = (commentary: Commentary) => {
    if (downloaded[commentary.name]) {
      handleRead(commentary);
    } else {
      handleDownload(commentary);
    }
  };

  return (
    <ThemedView style={s.container}>
      <View style={[s.hero, { borderBottomColor: colors.border }]}>
        <View style={s.heroTop}>
          <View style={[s.heroIcon, { backgroundColor: colors.tint + "18" }]}>
            <ThemedText style={[s.heroIconText, { color: colors.tint }]}>
              ✦
            </ThemedText>
          </View>
          <View style={s.heroInfo}>
            <ThemedText style={[s.heroTitle, { color: colors.text }]}>
              Bible Commentaries
            </ThemedText>
            <ThemedText style={[s.heroSubtitle, { color: colors.secondaryText }]}>
              John Schultz · {commentaries.length} PDF volumes
            </ThemedText>
          </View>
        </View>
        <View style={[s.stats, { backgroundColor: colors.card }]}>
          <View style={s.stat}>
            <ThemedText style={[s.statValue, { color: colors.tint }]}>
              {downloadedCount}
            </ThemedText>
            <ThemedText style={[s.statLabel, { color: colors.secondaryText }]}>
              Downloaded
            </ThemedText>
          </View>
          <View style={[s.statDivider, { backgroundColor: colors.border }]} />
          <View style={s.stat}>
            <ThemedText style={[s.statValue, { color: colors.tint }]}>
              {commentaries.length - downloadedCount}
            </ThemedText>
            <ThemedText style={[s.statLabel, { color: colors.secondaryText }]}>
              Available
            </ThemedText>
          </View>
          <View style={[s.statDivider, { backgroundColor: colors.border }]} />
          <View style={s.stat}>
            <ThemedText style={[s.statValue, { color: colors.tint }]}>
              PDF
            </ThemedText>
            <ThemedText style={[s.statLabel, { color: colors.secondaryText }]}>
              Format
            </ThemedText>
          </View>
        </View>
      </View>

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
          placeholder="Search commentaries..."
          placeholderTextColor={colors.secondaryText}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.name}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <ThemedText style={s.emptyEmoji}>📚</ThemedText>
            <ThemedText style={[s.emptyTitle, { color: colors.text }]}>
              No commentaries found
            </ThemedText>
            <ThemedText style={[s.emptyText, { color: colors.secondaryText }]}>
              Try a different search term.
            </ThemedText>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <ThemedText style={[s.sectionTitle, { color: colors.secondaryText }]}>
            {section.title.toUpperCase()}
          </ThemedText>
        )}
        renderItem={({ item }) => {
          const isDownloaded = !!downloaded[item.name];
          const isDownloading = downloading === item.name;
          const size = localSizes[item.name] ?? item.size ?? 0;

          return (
            <Pressable
              onPress={() => handlePress(item)}
              disabled={isDownloading}
              style={({ pressed }) => [
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDownloaded
                    ? colors.tint + "45"
                    : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View
                style={[
                  s.pdfIcon,
                  {
                    backgroundColor: isDownloaded
                      ? colors.tint + "18"
                      : colors.background,
                  },
                ]}
              >
                <ThemedText style={[s.pdfIconText, { color: colors.tint }]}>
                  PDF
                </ThemedText>
              </View>

              <View style={s.cardContent}>
                <ThemedText
                  style={[s.name, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {getCommentaryTitle(item.name)}
                </ThemedText>
                <ThemedText style={[s.meta, { color: colors.secondaryText }]}>
                  {isDownloading
                    ? `Downloading · ${formatCommentarySize(size)}`
                    : isDownloaded
                      ? `Downloaded · ${formatCommentarySize(size)}`
                      : `${formatCommentarySize(size)} · PDF`}
                </ThemedText>

                {isDownloaded ? (
                  <View style={s.actions}>
                    <Pressable onPress={() => handleRead(item)} hitSlop={8}>
                      <ThemedText style={[s.action, { color: colors.tint }]}>
                        Read
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => handleShare(item)} hitSlop={8}>
                      <ThemedText style={[s.action, { color: colors.tint }]}>
                        Share
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                      <ThemedText style={s.delete}>Delete</ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {isDownloading ? (
                <ActivityIndicator color={colors.tint} />
              ) : isDownloaded ? (
                <ThemedText style={[s.chevron, { color: colors.tint }]}>
                  ›
                </ThemedText>
              ) : (
                <View style={[s.downloadPill, { backgroundColor: colors.tint }]}>
                  <ThemedText style={s.downloadPillText}>↓</ThemedText>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

function getStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    hero: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    heroIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    heroIconText: { fontSize: 22 },
    heroInfo: { flex: 1 },
    heroTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
    heroSubtitle: { fontSize: 13, marginTop: 3 },
    stats: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    stat: { flex: 1, alignItems: "center" },
    statValue: { fontSize: 18, fontWeight: "800" },
    statLabel: { fontSize: 11, marginTop: 2 },
    statDivider: { width: StyleSheet.hairlineWidth, height: 26 },
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
    searchInput: { flex: 1, fontSize: 16, height: "100%" },
    list: { paddingHorizontal: 16, paddingTop: 6 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
      marginBottom: 9,
    },
    pdfIcon: {
      width: 44,
      height: 52,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    pdfIconText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
    cardContent: { flex: 1 },
    name: { fontSize: 16, fontWeight: "700" },
    meta: { fontSize: 12, marginTop: 3 },
    actions: { flexDirection: "row", gap: 18, marginTop: 9 },
    action: { fontSize: 13, fontWeight: "600" },
    delete: { color: "#D9534F", fontSize: 13, fontWeight: "600" },
    chevron: { fontSize: 24, fontWeight: "300" },
    downloadPill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    downloadPillText: { color: "#fff", fontSize: 17, fontWeight: "800" },
    emptyWrap: { alignItems: "center", padding: 40, gap: 6 },
    emptyEmoji: { fontSize: 40, marginBottom: 6 },
    emptyTitle: { fontSize: 17, fontWeight: "700" },
    emptyText: { fontSize: 14, textAlign: "center" },
  });
}
