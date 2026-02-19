import type { LocalizedString } from "@/lib/types";
import { defaultLanguage, normalizeLanguage, supportedLanguages, type LanguageCode } from "./languages";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";
import el from "./messages/el.json";
import ar from "./messages/ar.json";
import it from "./messages/it.json";
import th from "./messages/th.json";

const messagesByLanguage: Record<LanguageCode, Record<string, string>> = {
  en,
  fr,
  de,
  el,
  ar,
  it,
  th
};

export function getLanguageFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>
): LanguageCode {
  if (!searchParams) {
    return defaultLanguage;
  }
  const raw = searchParams.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return normalizeLanguage(value);
}

export function getLanguageFromUrlSearchParams(params: URLSearchParams | null): LanguageCode {
  if (!params) {
    return defaultLanguage;
  }
  return normalizeLanguage(params.get("lang"));
}

export function createTranslator(language: LanguageCode) {
  const bundle = messagesByLanguage[language] ?? messagesByLanguage[defaultLanguage];
  return (key: string, fallback?: string) => bundle[key] ?? messagesByLanguage[defaultLanguage][key] ?? fallback ?? key;
}

export function resolveLocalizedText(
  value: string | LocalizedString | null | undefined,
  language: LanguageCode,
  fallback: LanguageCode = defaultLanguage
) {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return value[language] ?? value[fallback] ?? Object.values(value)[0] ?? "";
}

export function normalizeLocalizedString(value: string | LocalizedString | null | undefined): LocalizedString {
  if (!value) {
    return {};
  }
  if (typeof value === "string") {
    return { [defaultLanguage]: value };
  }
  return value;
}

export function setLocalizedValue(
  value: string | LocalizedString | null | undefined,
  language: LanguageCode,
  next: string
): LocalizedString {
  const normalized = normalizeLocalizedString(value);
  return { ...normalized, [language]: next };
}

export function getLanguageLabel(language: LanguageCode) {
  return supportedLanguages.find((item) => item.code === language)?.label ?? language;
}
