import { Drawer } from "expo-router/drawer";
import { View, StyleSheet, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";

import { Colors, type ColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";

const logo = require("@/assets/images/icons/android/play_store_512.png");

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Drawer
      screenOptions={{
        headerTintColor: colors.tint,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        drawerActiveTintColor: colors.tint,
        drawerInactiveTintColor: colors.secondaryText,
        drawerStyle: { backgroundColor: colors.background },
        drawerActiveBackgroundColor: colors.tint + "15",
        drawerLabelStyle: { fontSize: 15, fontWeight: "500", marginLeft: -8 },
        drawerItemStyle: { borderRadius: 12, paddingVertical: 2 },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "OpenBiblia",
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="languages"
        options={{
          title: "Languages",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="language" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: "About",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="info-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

function DrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[styles.drawerContainer, { backgroundColor: colors.background }]}
    >
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.drawerLogoRow}>
          <Image source={logo} style={styles.drawerLogo} />
          <View>
            <ThemedText style={[styles.drawerTitle, { color: colors.tint }]}>
              OpenBiblia
            </ThemedText>
            <ThemedText
              style={[styles.drawerSubtitle, { color: colors.secondaryText }]}
            >
              The Open Bible Platform
            </ThemedText>
          </View>
        </View>
      </View>
      <DrawerContentScrollView {...props} style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  drawerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  drawerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  drawerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
});
