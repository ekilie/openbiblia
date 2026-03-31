/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6B4226';
const tintColorDark = '#D4A574';

export const Colors = {
  light: {
    text: '#1C1410',
    secondaryText: '#6B5B4F',
    background: '#FBF8F4',
    card: '#F2EBE3',
    tint: tintColorLight,
    accent: '#8B5E3C',
    border: '#E4D9CE',
    icon: '#8B7B6F',
    tabIconDefault: '#8B7B6F',
    tabIconSelected: tintColorLight,
    success: '#4A7C59',
    verseNum: '#A67C52',
  },
  dark: {
    text: '#EDE5DC',
    secondaryText: '#A89888',
    background: '#1A1512',
    card: '#2A231D',
    tint: tintColorDark,
    accent: '#C49A6C',
    border: '#3D342C',
    icon: '#9B8B7B',
    tabIconDefault: '#9B8B7B',
    tabIconSelected: tintColorDark,
    success: '#6B9F7B',
    verseNum: '#C49A6C',
  },
} as const;

export type ColorScheme = 'light' | 'dark';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
