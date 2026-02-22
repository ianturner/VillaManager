"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ThemeDto, ThemeFont } from "@/lib/types";
import { resolveTheme } from "@/lib/theme";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  theme?: ThemeDto | null;
  className?: string;
  children: ReactNode;
};

export function ThemeProvider({ theme, className, children }: ThemeProviderProps) {
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);
  const [mode, setMode] = useState<ThemeMode>(resolvedTheme.defaultMode ?? "light");

  useEffect(() => {
    const stored = window.localStorage.getItem("villa-theme-mode");
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("villa-theme-mode", mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const palette = mode === "dark" ? resolvedTheme.dark : resolvedTheme.light;
  const fonts = resolvedTheme.fonts;
  const headingSizes = resolvedTheme.headingSizes;
  const headingTransforms = resolvedTheme.headingTransforms;
  const style = {
    "--bg": palette.background,
    "--surface": palette.surface,
    "--text": palette.text,
    "--muted": palette.muted,
    "--primary": palette.primary,
    "--accent": palette.accent,
    "--border": palette.border,
    "--shadow": palette.shadow,
    "--text-shadow": palette.textShadow ? palette.textShadow : "none",
    "--input-brightness": mode === "light" ? "0.9" : "0.6",
    "--button-brightness": mode === "light" ? "0.9" : "0.6",
    "--font-base-family": fonts?.base.family ?? "system-ui",
    "--font-base-weight": fonts?.base.weight ?? "normal",
    "--font-base-style": fonts?.base.style ?? "normal",
    "--font-title-family": fonts?.title.family ?? "system-ui",
    "--font-title-weight": fonts?.title.weight ?? "normal",
    "--font-title-style": fonts?.title.style ?? "normal",
    "--font-subtitle-family": fonts?.subtitle.family ?? "system-ui",
    "--font-subtitle-weight": fonts?.subtitle.weight ?? "normal",
    "--font-subtitle-style": fonts?.subtitle.style ?? "normal",
    "--heading-h1-size": headingSizes?.h1 ?? "2.5rem",
    "--heading-h2-size": headingSizes?.h2 ?? "2.25rem",
    "--heading-h3-size": headingSizes?.h3 ?? "2rem",
    "--heading-h4-size": headingSizes?.h4 ?? "2.25rem",
    "--heading-h5-size": headingSizes?.h5 ?? "2rem",
    "--heading-h6-size": headingSizes?.h6 ?? "1.75rem",
    "--heading-h1-transform": headingTransforms?.h1 ?? "uppercase",
    "--heading-h2-transform": headingTransforms?.h2 ?? "uppercase",
    "--heading-h3-transform": headingTransforms?.h3 ?? "uppercase",
    "--heading-h4-transform": headingTransforms?.h4 ?? "none",
    "--heading-h5-transform": headingTransforms?.h5 ?? "none",
    "--heading-h6-transform": headingTransforms?.h6 ?? "none",
    "--body-text-size": resolvedTheme.bodyTextSize ?? "14px",
    "--card-radius": resolvedTheme.cornerRadius ?? "18px"
  } as React.CSSProperties;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(style).forEach(([key, value]) => {
      root.style.setProperty(key, String(value));
    });
  }, [style]);

  useEffect(() => {
    const fontDefs: ThemeFont[] = [
      fonts?.base,
      fonts?.title,
      fonts?.subtitle
    ].filter(Boolean) as ThemeFont[];
    const faceEntries = fontDefs
      .filter((font) => font.src)
      .map((font) => {
        const format = font.format ? ` format("${font.format}")` : "";
        const weight = font.weight ?? "normal";
        const styleValue = font.style ?? "normal";
        return `@font-face { font-family: "${font.family}"; src: url("${font.src}")${format}; font-weight: ${weight}; font-style: ${styleValue}; }`;
      })
      .filter((rule, index, list) => list.indexOf(rule) === index);

    const styleId = "theme-font-faces";
    let styleTag = document.querySelector<HTMLStyleElement>(`#${styleId}`);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = faceEntries.join("\n");
  }, [fonts]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <div className={className ? `theme-root ${className}` : "theme-root"}>
        {children}
      </div>
      <div className="copyright">
        © 2026, Mia Casa Studios. Progressive Enhancement FTW.
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
