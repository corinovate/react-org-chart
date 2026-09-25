export interface OrgChartTheme {
  background: string;
  cardBackground: string;
  cardBackgroundHover: string;
  cardBorder: string;
  cardBorderSelected: string;
  cardShadow: string;
  textPrimary: string;
  textSecondary: string;
  accentManagerReport: string;
  drawerBackground: string;
  fontFamily: string;
}

export const defaultTheme: OrgChartTheme = {
  background: '#f6f5f3',
  cardBackground: 'linear-gradient(180deg, #ffffff 0%, #fbfaf8 100%)',
  cardBackgroundHover: '#ffffff',
  cardBorder: '#e7e3dd',
  cardBorderSelected: '#3a6ea5',
  cardShadow: '0 1px 2px rgba(20, 16, 8, 0.04), 0 6px 16px rgba(20, 16, 8, 0.08)',
  textPrimary: '#221d15',
  textSecondary: '#7a7266',
  accentManagerReport: '#c9c2b4',
  drawerBackground: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export function themeToCssVars(theme: OrgChartTheme): Record<string, string> {
  return {
    '--oc-background': theme.background,
    '--oc-card-bg': theme.cardBackground,
    '--oc-card-bg-hover': theme.cardBackgroundHover,
    '--oc-card-border': theme.cardBorder,
    '--oc-card-border-selected': theme.cardBorderSelected,
    '--oc-card-shadow': theme.cardShadow,
    '--oc-text-primary': theme.textPrimary,
    '--oc-text-secondary': theme.textSecondary,
    '--oc-accent-manager-report': theme.accentManagerReport,
    '--oc-drawer-bg': theme.drawerBackground,
    '--oc-font-family': theme.fontFamily,
  };
}
