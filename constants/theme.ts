import { Platform } from 'react-native';

export const EcoColors = {
  // Green palette (primary)
  green900: '#14532D',
  green800: '#166534',
  green700: '#15803D',
  green600: '#16A34A',
  green500: '#22C55E',
  green400: '#4ADE80',
  green300: '#86EFAC',
  green200: '#BBF7D0',
  green100: '#DCFCE7',
  green50:  '#F0FDF4',

  // Blue palette (secondary)
  blue900: '#0C4A6E',
  blue700: '#0369A1',
  blue600: '#0284C7',
  blue500: '#0EA5E9',
  blue400: '#38BDF8',
  blue200: '#BAE6FD',
  blue100: '#E0F2FE',
  blue50:  '#F0F9FF',

  // Neutral
  dark:    '#1C1917',
  gray700: '#44403C',
  gray600: '#57534E',
  gray400: '#A8A29E',
  gray300: '#D6D3D1',
  gray200: '#E7E5E4',
  gray100: '#F5F5F4',
  white:   '#FFFFFF',

  // Semantic
  primary:        '#16A34A',
  primaryLight:   '#22C55E',
  primaryPale:    '#DCFCE7',
  secondary:      '#0EA5E9',
  secondaryLight: '#38BDF8',
  secondaryPale:  '#E0F2FE',
  background:     '#F0FDF4',
  card:           '#FFFFFF',
  border:         '#BBF7D0',
  text:           '#1C1917',
  textSecondary:  '#57534E',
  textMuted:      '#A8A29E',
  success:        '#16A34A',
  warning:        '#F59E0B',
  danger:         '#EF4444',

  // Category colors
  catClimate:  '#DC2626',
  catWildlife: '#059669',
  catOcean:    '#0284C7',
  catEnergy:   '#D97706',
  catPolicy:   '#7C3AED',
  catBlog:     '#0EA5E9',
};

// Keep Colors for backward compat with existing components
export const Colors = {
  light: {
    text:            EcoColors.dark,
    background:      EcoColors.background,
    tint:            EcoColors.primary,
    icon:            EcoColors.green600,
    tabIconDefault:  EcoColors.gray400,
    tabIconSelected: EcoColors.primary,
  },
  dark: {
    text:            '#ECEDEE',
    background:      '#0F1F12',
    tint:            EcoColors.green400,
    icon:            EcoColors.green300,
    tabIconDefault:  '#9BA1A6',
    tabIconSelected: EcoColors.green400,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
