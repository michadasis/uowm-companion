import { useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';

import * as glyphs from './glyphs';

// The one place icons come from, so the app keeps to a single set. Names say
// what an icon means here rather than what it depicts, which lets a glyph be
// swapped without touching the screens that use it.
const icons = {
  home: glyphs.HouseIcon,
  announcements: glyphs.MegaphoneIcon,
  schedule: glyphs.CalendarDotsIcon,
  menu: glyphs.ForkKnifeIcon,
  more: glyphs.SquaresFourIcon,
  search: glyphs.MagnifyingGlassIcon,
  close: glyphs.XIcon,
  back: glyphs.ArrowLeftIcon,
  forward: glyphs.CaretRightIcon,
  check: glyphs.CheckIcon,
  retry: glyphs.ArrowClockwiseIcon,
  empty: glyphs.TrayIcon,
  offline: glyphs.WifiSlashIcon,
  error: glyphs.WarningCircleIcon,
  department: glyphs.GraduationCapIcon,
  location: glyphs.MapPinIcon,
  language: glyphs.TranslateIcon,
  appearance: glyphs.PaletteIcon,
  about: glyphs.InfoIcon,
  designSystem: glyphs.SparkleIcon,
} as const;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof ColorTokens;
  weight?: 'regular' | 'bold' | 'fill';
}

export function Icon({ name, size, color = 'text', weight = 'regular' }: IconProps) {
  const theme = useTheme();
  const Glyph = icons[name];
  return <Glyph size={size ?? theme.size.icon.md} color={theme.colors[color]} weight={weight} />;
}
