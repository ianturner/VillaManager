"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getListingLanguageOptions, supportedLanguages, type LanguageCode } from "@/lib/i18n/languages";
import { useTranslations } from "@/lib/i18n/useLanguage";

type LanguageOption = { code: LanguageCode; label: string; flag: string };

type LanguageSelectProps = {
  label?: string;
  className?: string;
  /** When set, only these languages are shown (e.g. property listing languages). */
  allowedLanguages?: string[] | null;
};

export default function LanguageSelect({ label, className, allowedLanguages }: LanguageSelectProps) {
  const { language, setLanguage, t } = useTranslations();
  const ariaLabel = label ?? t("language.label");
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const options: LanguageOption[] = useMemo(
    () =>
      allowedLanguages?.length
        ? (getListingLanguageOptions(allowedLanguages) as LanguageOption[])
        : (supportedLanguages as unknown as LanguageOption[]),
    [allowedLanguages]
  );

  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.code === language)),
    [language, options]
  );
  const selectedLanguage = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (options.length === 0) return;
    const currentInOptions = options.some((o) => o.code === language);
    if (!currentInOptions) {
      setLanguage(options[0].code);
    }
  }, [language, options, setLanguage]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const selectLanguage = (index: number) => {
    const option = options[index];
    if (!option) {
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("languageOverride", "1");
    }
    setLanguage(option.code);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(selectedIndex);
      } else {
        selectLanguage(highlightedIndex);
      }
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(selectedIndex);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectLanguage(highlightedIndex);
    }
  };

  return (
    <div
      className={className ? `hero-button-container ${className}` : "hero-button-container"}
      ref={rootRef}
    >
      <button
        type="button"
        className="language-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHighlightedIndex(selectedIndex);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="language-flag" aria-hidden="true">
          {selectedLanguage.flag}
        </span>
      </button>
      {isOpen ? (
        <ul
          id={listboxId}
          className="language-select-menu"
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {options.map((option, index) => {
            const isSelected = option.code === language;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={option.code}
                role="option"
                aria-selected={isSelected}
                className={`language-select-option${isHighlighted ? " active" : ""}${
                  isSelected ? " selected" : ""
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  selectLanguage(index);
                }}
              >
                <span className="language-flag" aria-hidden="true">
                  {option.flag}
                </span>
                <span className="language-label">{option.label}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
