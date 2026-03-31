import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/services/store';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const theme = useAppStore((s) => s.theme);

  if (theme === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return theme;
}
