import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useAppStore } from "@/services/store";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const refreshDownloaded = useAppStore((s) => s.refreshDownloaded);

  useEffect(() => {
    refreshDownloaded();
  }, []);

  const navTheme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: colors.tint,
            background: colors.background,
            card: colors.background,
            text: colors.text,
            border: colors.border,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: colors.tint,
            background: colors.background,
            card: colors.background,
            text: colors.text,
            border: colors.border,
          },
        };

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerTintColor: colors.tint,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="translations/[lang]"
          options={{ title: "Translations" }}
        />
        <Stack.Screen name="reader/[id]/index" options={{ title: "Books" }} />
        <Stack.Screen
          name="reader/[id]/[book]/index"
          options={{ title: "Chapters" }}
        />
        <Stack.Screen
          name="reader/[id]/[book]/[chapter]"
          options={{ title: "Reading" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
