"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createTranslator, getLanguageFromUrlSearchParams } from "./index";
import { defaultLanguage, type LanguageCode } from "./languages";

type UseLanguageResult = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
};

export function useLanguageParam(): UseLanguageResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const language = useMemo(
    () => getLanguageFromUrlSearchParams(searchParams),
    [searchParams]
  );

  const setLanguage = (next: LanguageCode) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next === defaultLanguage) {
      params.delete("lang");
    } else {
      params.set("lang", next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return { language, setLanguage };
}

export function useTranslations() {
  const { language, setLanguage } = useLanguageParam();
  const t = useMemo(() => createTranslator(language), [language]);
  return { language, setLanguage, t };
}
