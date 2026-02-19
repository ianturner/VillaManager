"use client";

import { useEffect, useState } from "react";

import { supportedLanguages, type LanguageCode } from "@/lib/i18n/languages";
import { normalizeLocalizedString, resolveLocalizedText, setLocalizedValue } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n/useLanguage";
import type { LocalizedString } from "@/lib/types";
import RichTextEditor from "@/components/RichTextEditor";

type LanguageOption = { code: string; label: string; flag: string };

type LocalizedRichTextFieldProps = {
  label: string;
  value: string | LocalizedString | null | undefined;
  onChange: (next: LocalizedString) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  /** When set, only these languages are shown in tabs (e.g. property listing languages). */
  languageOptions?: LanguageOption[] | null;
};

export default function LocalizedRichTextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows,
  className,
  languageOptions: languageOptionsProp
}: LocalizedRichTextFieldProps) {
  const { language: globalLanguage } = useTranslations();
  const [fieldLanguage, setFieldLanguage] = useState(globalLanguage);
  const options = languageOptionsProp?.length
    ? languageOptionsProp
    : (supportedLanguages as unknown as LanguageOption[]);
  const currentValue = resolveLocalizedText(value, fieldLanguage);
  const normalized = normalizeLocalizedString(value);
  const missingLanguages = options.filter(({ code }) => {
    const entry = normalized[code];
    return typeof entry !== "string" || entry.trim().length === 0;
  });
  const hasMissingTranslations = missingLanguages.length > 0;
  const missingCodes = new Set(missingLanguages.map(({ code }) => code));
  const missingClassName = hasMissingTranslations ? " missing-translation" : "";

  useEffect(() => {
    setFieldLanguage(globalLanguage);
  }, [globalLanguage]);

  return (
    <label
      className={
        className
          ? `admin-field localized-field${missingClassName} ${className}`
          : `admin-field localized-field${missingClassName}`
      }
      data-missing-translations={hasMissingTranslations ? missingLanguages.map(({ code }) => code).join(",") : undefined}
    >
      <span>{label}</span>
      <div className="localized-tabs">
        {options.map((option) => (
          <button
            key={option.code}
            type="button"
            className={
              option.code === fieldLanguage
                ? `admin-tab active${missingCodes.has(option.code) ? " missing-translation" : ""}`
                : `admin-tab${missingCodes.has(option.code) ? " missing-translation" : ""}`
            }
            onClick={() => setFieldLanguage(option.code as LanguageCode)}
            aria-label={`${label}: ${option.label}`}
          >
            {option.flag}
          </button>
        ))}
      </div>
      <RichTextEditor
        rows={rows}
        value={currentValue}
        placeholder={placeholder}
        onChange={(nextValue) => onChange(setLocalizedValue(value, fieldLanguage, nextValue))}
      />
    </label>
  );
}
