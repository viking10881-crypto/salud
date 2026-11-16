import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

// Mantener sincronizado con las variables de src/global.css
export const THEME = {
  light: {
    background: 'hsl(260 60% 98%)',
    foreground: 'hsl(258 40% 16%)',
    card: 'hsl(0 0% 100%)',
    primary: 'hsl(262 72% 52%)',
    mutedForeground: 'hsl(258 15% 45%)',
    border: 'hsl(260 40% 90%)',
    destructive: 'hsl(352 80% 55%)',
    heart: 'hsl(340 82% 58%)',
  },
  dark: {
    background: 'hsl(258 35% 8%)',
    foreground: 'hsl(260 40% 96%)',
    card: 'hsl(258 30% 12%)',
    primary: 'hsl(262 80% 68%)',
    mutedForeground: 'hsl(260 15% 68%)',
    border: 'hsl(260 22% 22%)',
    destructive: 'hsl(352 70% 60%)',
    heart: 'hsl(340 80% 65%)',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
