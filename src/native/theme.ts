export interface OrgChartTheme {
  background: string;
  cardBackground: string;
  cardBackgroundHover: string;
  cardBorder: string;
  cardBorderSelected: string;
  textPrimary: string;
  textSecondary: string;
  accentManagerReport: string;
  drawerBackground: string;
}

// Mirrors src/react/theme.ts, minus web-only concerns (CSS var plumbing, a CSS
// gradient string for cardBackground — RN can't parse a CSS `linear-gradient()`
// string as a backgroundColor, so this stays a flat color; use expo-linear-gradient
// as an optional overlay if a gradient card look is wanted).
export const defaultTheme: OrgChartTheme = {
  background: '#f6f5f3',
  cardBackground: '#ffffff',
  cardBackgroundHover: '#ffffff',
  cardBorder: '#e7e3dd',
  cardBorderSelected: '#3a6ea5',
  textPrimary: '#221d15',
  textSecondary: '#7a7266',
  accentManagerReport: '#c9c2b4',
  drawerBackground: '#ffffff',
};
