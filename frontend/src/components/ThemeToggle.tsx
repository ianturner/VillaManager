"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useTranslations } from "@/lib/i18n/useLanguage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const { t } = useTranslations();

  return (
    <div className="theme-toggle-pill" role="group" aria-label={t("theme.mode")}>
      <button
        type="button"
        className={mode === "light" ? "theme-toggle theme-light active" : "theme-toggle theme-light"}
        onClick={mode === "light" ? undefined : toggleMode}
        aria-label={t("theme.light")}
      >
        <span className="theme-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faSun} />
        </span>
      </button>
      <button
        type="button"
        className={mode === "dark" ? "theme-toggle theme-dark active" : "theme-toggle theme-dark"}
        onClick={mode === "dark" ? undefined : toggleMode}
        aria-label={t("theme.dark")}
      >
        <span className="theme-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faMoon} />
        </span>
      </button>
    </div>
  );
}
