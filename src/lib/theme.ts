import { parseJson } from "./json.js";

export const THEME_IDS = ["default", "sunny", "dark"] as const;
export const DEFAULT_THEME_ID = "default";

function normalizeThemeValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function sanitizeThemeRecord(
  theme: Record<string, string>,
  fallbackName: string
): Record<string, string> {
  const nextTheme = { ...theme };

  delete nextTheme.adminPassword;
  delete nextTheme.adminPasswordHash;

  const explicitHeroTitle = normalizeThemeValue(nextTheme.heroTitle);
  const creatorName = normalizeThemeValue(nextTheme.creatorName);
  const fallbackHeroTitle = explicitHeroTitle || creatorName || fallbackName.trim();

  if (fallbackHeroTitle) {
    nextTheme.heroTitle = fallbackHeroTitle;
  } else {
    delete nextTheme.heroTitle;
  }

  return nextTheme;
}

export function parseTenantTheme(rawTheme: string | null | undefined, fallbackName: string): Record<string, string> {
  const parsedTheme = parseJson<Record<string, string>>(rawTheme, {});
  return sanitizeThemeRecord(parsedTheme, fallbackName);
}
