export type TextDirection = "ltr" | "rtl";

export const supportedLanguages = [
  { code: "en", label: "English", flag: "🇬🇧", direction: "ltr" as const },
  { code: "fr", label: "Français", flag: "🇫🇷", direction: "ltr" as const },
  { code: "de", label: "Deutsch", flag: "🇩🇪", direction: "ltr" as const },
  { code: "it", label: "Italiano", flag: "🇮🇹", direction: "ltr" as const },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷", direction: "ltr" as const },
  { code: "ar", label: "العربية", flag: "🇸🇦", direction: "rtl" as const },
  { code: "th", label: "ไทย", flag: "🇹🇭", direction: "ltr" as const }
] as const;

export const defaultLanguage = "en";

export type LanguageCode = (typeof supportedLanguages)[number]["code"];

/** All supported language codes (app-level). */
export const allSupportedLanguageCodes: LanguageCode[] = supportedLanguages.map((l) => l.code);

/**
 * Default listing languages for properties that have none set (e.g. existing data before listingLanguages existed).
 * New languages added to the app are not included here—properties must explicitly select them.
 */
export const defaultListingLanguageCodes: LanguageCode[] = ["en"];

/** Text direction for a language code (e.g. for dir attribute). */
export function getLanguageDirection(code: string | null | undefined): TextDirection {
  const lang = supportedLanguages.find((l) => l.code === code?.toLowerCase());
  return lang?.direction ?? "ltr";
}

/**
 * Options for the property's listing languages (full { code, label, flag, direction }).
 * When listingLanguages is null/empty, returns defaultListingLanguageCodes (not all supported).
 */
export function getListingLanguageOptions(
  listingLanguages?: string[] | null
): Array<{ code: LanguageCode; label: string; flag: string; direction: TextDirection }> {
  const codes = listingLanguages?.length
    ? listingLanguages.filter((c) =>
        supportedLanguages.some((l) => l.code === c.toLowerCase())
      ) as LanguageCode[]
    : [...defaultListingLanguageCodes];
  if (codes.length === 0) {
    return defaultListingLanguageCodes
      .map((code) => supportedLanguages.find((l) => l.code === code))
      .filter((o): o is (typeof supportedLanguages)[number] => o != null);
  }
  return codes
    .map((code) => supportedLanguages.find((l) => l.code === code))
    .filter((o): o is (typeof supportedLanguages)[number] => o != null);
}

/**
 * Listing language codes for a property (for validation/display).
 * When missing, returns defaultListingLanguageCodes (not all supported).
 */
export function getPropertyListingLanguages(property: {
  listingLanguages?: string[] | null;
}): LanguageCode[] {
  const list = property.listingLanguages;
  if (!list?.length) {
    return defaultListingLanguageCodes;
  }
  return list.filter((c) =>
    supportedLanguages.some((l) => l.code === c.toLowerCase())
  ) as LanguageCode[];
}

export function isPropertyListingLanguage(
  code: string | null | undefined,
  listingLanguages?: string[] | null
): boolean {
  if (!code) return false;
  const list = listingLanguages?.length ? listingLanguages : defaultListingLanguageCodes;
  return list.some((c) => c.toLowerCase() === code.toLowerCase());
}

/**
 * Coerce to a valid listing language code; when not in the list, return first listing language or default.
 */
export function normalizeListingLanguage(
  code?: string | null,
  listingLanguages?: string[] | null
): LanguageCode {
  const list = listingLanguages?.length ? listingLanguages : defaultListingLanguageCodes;
  const normalized = code?.toLowerCase();
  const match = list.find((c) => c.toLowerCase() === normalized);
  if (match) return match as LanguageCode;
  return (list[0] as LanguageCode) ?? defaultLanguage;
}

export function normalizeLanguage(code?: string | null): LanguageCode {
  if (!code) {
    return defaultLanguage;
  }
  const normalized = code.toLowerCase();
  const match = supportedLanguages.find((language) => language.code === normalized);
  return match?.code ?? defaultLanguage;
}

export function isSupportedLanguage(code?: string | null): code is LanguageCode {
  if (!code) {
    return false;
  }
  return supportedLanguages.some((language) => language.code === code.toLowerCase());
}
