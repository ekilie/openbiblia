import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
