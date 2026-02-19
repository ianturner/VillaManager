"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faPlus, faSave, faSignOutAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelect from "@/components/LanguageSelect";
import AdminSelect from "@/components/AdminSelect";
import ShadowControl from "@/components/ShadowControl";
import { isSupportedLanguage } from "@/lib/i18n/languages";
import { useTranslations } from "@/lib/i18n/useLanguage";
import { useAdminSessionRefresh } from "@/lib/useAdminSessionRefresh";
import {
  AuthError,
  PermissionError,
  clearToken,
  createTheme,
  deleteTheme,
  getStoredToken,
  getStoredUser,
  getThemes,
  updateTheme,
  type ThemeLibrary
} from "@/lib/adminApi";

type ThemeDraft = ThemeLibrary & {
  isNew?: boolean;
  tempId?: string;
};

type ThemeFont = NonNullable<ThemeLibrary["fonts"]>["base"];

const resolveFont = (font?: ThemeFont | null): ThemeFont => ({
  family: font?.family ?? "system-ui",
  src: font?.src ?? "",
  format: font?.format ?? "truetype",
  weight: font?.weight ?? "normal",
  style: font?.style ?? "normal"
});

const normalizeFonts = (fonts?: ThemeLibrary["fonts"] | null) => ({
  base: resolveFont(fonts?.base),
  title: resolveFont(fonts?.title),
  subtitle: resolveFont(fonts?.subtitle)
});

const toFontFaceRule = (font?: ThemeFont | null) => {
  if (!font || !font.src || !font.family) {
    return null;
  }
  const format = font.format ? ` format("${font.format}")` : "";
  const weight = font.weight ?? "normal";
  const style = font.style ?? "normal";
  return `@font-face { font-family: "${font.family}"; src: url("${font.src}")${format}; font-weight: ${weight}; font-style: ${style}; }`;
};

const fontOptions = [
  { value: "Avenir Next", label: "Avenir Next", src: "/fonts/Avenir Next.ttc" },
  { value: "BetanyOasis", label: "Betany Oasis", src: "/fonts/BetanyOasis-j9JXR.otf" },
  { value: "Calibri", label: "Calibri", src: "/fonts/Calibri.ttf" },
  { value: "Calibril", label: "Calibril", src: "/fonts/Calibril.ttf" },
  { value: "Cervino", label: "Cervino", src: "/fonts/Cervino-LightNeue.ttf" },
  { value: "Chalkboard", label: "Chalkboard", src: "/fonts/ChalkboardSE.ttc" },
  { value: "Hardest Style Demo", label: "Hardest Style Demo", src: "/fonts/Hardest-Style-Demo.woff" },
  { value: "Sign Painter", label: "Sign Painter", src: "/fonts/SignPainter.ttc" },
  { value: "Tomatoes", label: "Tomatoes", src: "/fonts/Tomatoes-O8L8.ttf" },
  { value: "system-ui", label: "System UI", src: "" }
];

const getFontFormatFromFile = (src: string) => {
  const lower = src.toLowerCase();
  if (lower.endsWith(".otf")) {
    return "opentype";
  }
  if (lower.endsWith(".woff2")) {
    return "woff2";
  }
  if (lower.endsWith(".woff")) {
    return "woff";
  }
  if (lower.endsWith(".ttc") || lower.endsWith(".ttf")) {
    return "truetype";
  }
  if (lower.endsWith(".svg")) {
    return "svg";
  }
  if (lower.endsWith(".eot")) {
    return "embedded-opentype";
  }
  return "truetype";
};

const fontWeightOptions = [
  { value: "normal", label: "normal" },
  { value: "100", label: "100" },
  { value: "200", label: "200" },
  { value: "300", label: "300" },
  { value: "400", label: "400" },
  { value: "500", label: "500" },
  { value: "600", label: "600" },
  { value: "700", label: "700" }
];

const fontStyleOptions = [
  { value: "normal", label: "normal" },
  { value: "italic", label: "italic" },
  { value: "oblique", label: "oblique" }
];

const defaultHeadingSizes = {
  h1: "3rem",
  h2: "2.6rem",
  h3: "2.1rem",
  h4: "2.25rem",
  h5: "2rem",
  h6: "1.75rem"
};

const defaultHeadingTransforms = {
  h1: "uppercase",
  h2: "uppercase",
  h3: "uppercase",
  h4: "none",
  h5: "none",
  h6: "none"
};

const defaultBodyTextSize = "16px";
const defaultCornerRadius = "18px";

const clamp = (value: number) => Math.min(255, Math.max(0, value));

const adjustHex = (value: string, delta: number) => {
  const normalized = value.replace("#", "");
  if (normalized.length !== 6) {
    return value;
  }
  const r = clamp(parseInt(normalized.slice(0, 2), 16) + delta);
  const g = clamp(parseInt(normalized.slice(2, 4), 16) + delta);
  const b = clamp(parseInt(normalized.slice(4, 6), 16) + delta);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
};

const adjustShadowAlpha = (value: string, delta: number) => {
  const match = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/i);
  if (!match) {
    return value;
  }
  const alpha = Math.min(1, Math.max(0, Number.parseFloat(match[4]) + delta));
  return value.replace(match[4], alpha.toFixed(2));
};

const deriveTheme = (base: ThemeLibrary, username: string) => {
  const suffix = Date.now().toString(36);
  return {
    ...base,
    name: `${base.name}-${username || "user"}-${suffix}`,
    displayName: `${base.displayName} (Private)`,
    isPrivate: true,
    createdBy: username || undefined,
    fonts: base.fonts,
    headingSizes: base.headingSizes ?? defaultHeadingSizes,
    headingTransforms: base.headingTransforms ?? defaultHeadingTransforms,
    bodyTextSize: base.bodyTextSize ?? defaultBodyTextSize,
    cornerRadius: base.cornerRadius ?? defaultCornerRadius,
    light: {
      ...base.light,
      background: adjustHex(base.light.background, 4),
      surface: adjustHex(base.light.surface, 4),
      text: adjustHex(base.light.text, 2),
      muted: adjustHex(base.light.muted, 2),
      primary: adjustHex(base.light.primary, 2),
      accent: adjustHex(base.light.accent, 2),
      border: adjustHex(base.light.border, 4),
      shadow: adjustShadowAlpha(base.light.shadow, 0.02),
      textShadow: base.light.textShadow
        ? adjustShadowAlpha(base.light.textShadow, 0.02)
        : base.light.textShadow
    },
    dark: {
      ...base.dark,
      background: adjustHex(base.dark.background, -4),
      surface: adjustHex(base.dark.surface, -4),
      text: adjustHex(base.dark.text, -2),
      muted: adjustHex(base.dark.muted, -2),
      primary: adjustHex(base.dark.primary, -2),
      accent: adjustHex(base.dark.accent, -2),
      border: adjustHex(base.dark.border, -4),
      shadow: adjustShadowAlpha(base.dark.shadow, 0.02),
      textShadow: base.dark.textShadow
        ? adjustShadowAlpha(base.dark.textShadow, 0.02)
        : base.dark.textShadow
    }
  } satisfies ThemeDraft;
};

function AdminThemesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLanguage, t } = useTranslations();
  const token = useMemo(() => getStoredToken(), []);
  useAdminSessionRefresh({
    onExpired: () => {
      clearToken();
      router.push("/admin/login");
    }
  });
  const defaultModeOptions = useMemo(
    () => [
      { value: "light", label: t("theme.light") },
      { value: "dark", label: t("theme.dark") }
    ],
    [t]
  );
  const headingTransformOptions = useMemo(
    () => [
      { value: "none", label: t("admin.theme.headingTransform.none") },
      { value: "uppercase", label: t("admin.theme.headingTransform.uppercase") },
      { value: "lowercase", label: t("admin.theme.headingTransform.lowercase") },
      { value: "capitalize", label: t("admin.theme.headingTransform.capitalize") }
    ],
    [t]
  );
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const hasAppliedPreferredLanguage = useRef(false);
  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);
  useEffect(() => {
    if (hasAppliedPreferredLanguage.current) {
      return;
    }
    if (!currentUser?.preferredLanguage) {
      return;
    }
    if (typeof window !== "undefined") {
      const hasOverride = window.sessionStorage.getItem("languageOverride") === "1";
      if (hasOverride) {
        hasAppliedPreferredLanguage.current = true;
        return;
      }
    }
    if (searchParams?.get("lang")) {
      hasAppliedPreferredLanguage.current = true;
      return;
    }
    if (!isSupportedLanguage(currentUser.preferredLanguage)) {
      return;
    }
    setLanguage(currentUser.preferredLanguage);
    hasAppliedPreferredLanguage.current = true;
  }, [currentUser?.preferredLanguage, searchParams, setLanguage]);
  const username = currentUser?.username ?? "";
  const { mode } = useTheme();
  const isAdmin = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.includes("admin");
  }, [currentUser]);
  const isPropertyOwner = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.some((role) =>
      ["property-owner", "property_owner", "propertyowner", "owner"].includes(role)
    );
  }, [currentUser]);
  const canCreateThemes = isAdmin || isPropertyOwner;

  const [themes, setThemes] = useState<ThemeDraft[]>([]);
  const [expandedByName, setExpandedByName] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingByName, setIsSavingByName] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastFadeOut, setToastFadeOut] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const loadThemes = async () => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await getThemes(token);
      setThemes(data);
      setExpandedByName((prev) => {
        if (Object.keys(prev).length > 0) {
          return prev;
        }
        const next: Record<string, boolean> = {};
        data.forEach((theme) => {
          next[theme.name] = false;
        });
        return next;
      });
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.theme.errors.permission"));
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.theme.errors.load"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    setToastFadeOut(false);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastFadeOut(true);
      toastTimeoutRef.current = null;
      window.setTimeout(() => {
        setToastMessage(null);
        setToastFadeOut(false);
      }, 500);
    }, 3000);
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const rules = themes
      .flatMap((theme) => [theme.fonts?.base, theme.fonts?.title, theme.fonts?.subtitle])
      .map((font) => toFontFaceRule(font))
      .filter((rule): rule is string => Boolean(rule));
    const uniqueRules = Array.from(new Set(rules));
    const styleId = "theme-library-font-faces";
    let styleTag = document.querySelector<HTMLStyleElement>(`#${styleId}`);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = uniqueRules.join("\n");
  }, [themes]);

  useEffect(() => {
    const baseName = searchParams.get("base");
    if (!baseName || themes.length === 0) {
      return;
    }
    const baseTheme = themes.find((theme) => theme.name === baseName);
    if (!baseTheme) {
      return;
    }
    const derived = deriveTheme(baseTheme, username);
    const tempId = `theme-${Date.now().toString(36)}`;
    setThemes((prev) => {
      if (prev.some((theme) => theme.name === derived.name)) {
        return prev;
      }
      return [...prev, { ...derived, isNew: true, tempId }];
    });
    setExpandedByName((prev) => ({ ...prev, [tempId]: true }));
  }, [searchParams, themes.length, username]);

  const updateThemeDraft = (name: string, updater: (theme: ThemeDraft) => ThemeDraft) => {
    setThemes((prev) => prev.map((theme) => (theme.name === name ? updater(theme) : theme)));
  };

  const handleAddTheme = () => {
    if (!canCreateThemes) {
      return;
    }
    const name = `theme-${Date.now().toString(36)}`;
    const tempId = `theme-${Date.now().toString(36)}-draft`;
    const newTheme: ThemeDraft = {
      name,
      displayName: t("admin.theme.newTheme"),
      isPrivate: true,
      createdBy: username || undefined,
      defaultMode: "light",
      headingSizes: defaultHeadingSizes,
      headingTransforms: defaultHeadingTransforms,
      bodyTextSize: defaultBodyTextSize,
      cornerRadius: defaultCornerRadius,
      fonts: {
        base: {
          family: "Calibri",
          src: "/fonts/Calibri.ttf",
          format: "truetype",
          weight: "normal",
          style: "normal"
        },
        title: {
          family: "Calibri",
          src: "/fonts/Calibri.ttf",
          format: "truetype",
          weight: "normal",
          style: "normal"
        },
        subtitle: {
          family: "Calibri",
          src: "/fonts/Calibri.ttf",
          format: "truetype",
          weight: "normal",
          style: "normal"
        }
      },
      light: {
        background: "#f5f7fa",
        surface: "#fbfcfd",
        text: "#1f2933",
        muted: "#52606d",
        primary: "#1d9537",
        accent: "#0ea5e9",
        border: "#e5e7eb",
        shadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        textShadow: "none"
      },
      dark: {
        background: "#0b1120",
        surface: "#111827",
        text: "#f9fafb",
        muted: "#9ca3af",
        primary: "#1d9537",
        accent: "#38bdf8",
        border: "#1f2937",
        shadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        textShadow: "none"
      },
      isNew: true,
      tempId
    };
    setThemes((prev) => [...prev, newTheme]);
    setExpandedByName((prev) => ({ ...prev, [tempId]: true }));
  };

  const handleSaveTheme = async (theme: ThemeDraft) => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (!theme.name.trim() || !theme.displayName.trim()) {
      setError(t("admin.theme.errors.required"));
      return;
    }
    setIsSavingByName((prev) => ({ ...prev, [theme.name]: true }));
    setError("");
    try {
      if (theme.isNew) {
        const created = await createTheme(token, {
          name: theme.name.trim(),
          displayName: theme.displayName.trim(),
          isPrivate: theme.isPrivate,
          defaultMode: theme.defaultMode ?? "light",
          light: theme.light,
          dark: theme.dark,
          fonts: theme.fonts ?? null,
          headingSizes: theme.headingSizes ?? null,
          headingTransforms: theme.headingTransforms ?? null,
          bodyTextSize: theme.bodyTextSize ?? null,
          cornerRadius: theme.cornerRadius ?? null
        });
        setThemes((prev) =>
          prev.map((item) =>
            item.name === theme.name ? { ...created, isNew: false } : item
          )
        );
        if (theme.tempId) {
          setExpandedByName((prev) => {
            const next = { ...prev };
            delete next[theme.tempId as string];
            next[created.name] = true;
            return next;
          });
        }
      } else {
        const updated = await updateTheme(token, theme.name, {
          displayName: theme.displayName.trim(),
          isPrivate: theme.isPrivate,
          createdBy: theme.createdBy ?? null,
          defaultMode: theme.defaultMode ?? "light",
          light: theme.light,
          dark: theme.dark,
          fonts: theme.fonts ?? null,
          headingSizes: theme.headingSizes ?? null,
          headingTransforms: theme.headingTransforms ?? null,
          bodyTextSize: theme.bodyTextSize ?? null,
          cornerRadius: theme.cornerRadius ?? null
        });
        setThemes((prev) =>
          prev.map((item) => (item.name === theme.name ? { ...updated } : item))
        );
      }
      setToastMessage(t("admin.toast.themeSaved"));
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.theme.errors.permission"));
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.theme.errors.save"));
    } finally {
      setIsSavingByName((prev) => ({ ...prev, [theme.name]: false }));
    }
  };

  const handleDeleteTheme = async (theme: ThemeDraft) => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (theme.isNew) {
      setThemes((prev) => prev.filter((item) => item.name !== theme.name));
      return;
    }
    setIsSavingByName((prev) => ({ ...prev, [theme.name]: true }));
    try {
      await deleteTheme(token, theme.name);
      setThemes((prev) => prev.filter((item) => item.name !== theme.name));
      setToastMessage(t("admin.toast.themeDeleted"));
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.theme.errors.permission"));
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.theme.errors.delete"));
    } finally {
      setIsSavingByName((prev) => ({ ...prev, [theme.name]: false }));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("languageOverride");
    }
    clearToken();
    router.push("/admin/login");
  };

  const getThemeVars = (theme: ThemeLibrary): CSSProperties => {
    const palette = mode === "dark" ? theme.dark : theme.light;
    return {
      "--admin-surface": palette.surface,
      "--admin-text": palette.text,
      "--admin-muted": palette.muted,
      "--admin-border": palette.border,
      "--admin-shadow": palette.shadow,
      "--admin-text-shadow": palette.textShadow ?? "none",
      "--admin-accent": palette.accent,
      "--admin-primary": palette.primary,
      "--font-base-family": theme.fonts?.base.family ?? "system-ui",
      "--font-base-weight": theme.fonts?.base.weight ?? "normal",
      "--font-base-style": theme.fonts?.base.style ?? "normal",
      "--font-title-family": theme.fonts?.title.family ?? "system-ui",
      "--font-title-weight": theme.fonts?.title.weight ?? "normal",
      "--font-title-style": theme.fonts?.title.style ?? "normal",
      "--font-subtitle-family": theme.fonts?.subtitle.family ?? "system-ui",
      "--font-subtitle-weight": theme.fonts?.subtitle.weight ?? "normal",
      "--font-subtitle-style": theme.fonts?.subtitle.style ?? "normal",
      "--heading-h1-size": theme.headingSizes?.h1 ?? "2.8rem",
      "--heading-h2-size": theme.headingSizes?.h2 ?? "2.2rem",
      "--heading-h3-size": theme.headingSizes?.h3 ?? "2rem",
      "--heading-h4-size": theme.headingSizes?.h4 ?? "2.25rem",
      "--heading-h5-size": theme.headingSizes?.h5 ?? "2rem",
      "--heading-h6-size": theme.headingSizes?.h6 ?? "1.75rem",
      "--heading-h1-transform": theme.headingTransforms?.h1 ?? "uppercase",
      "--heading-h2-transform": theme.headingTransforms?.h2 ?? "uppercase",
      "--heading-h3-transform": theme.headingTransforms?.h3 ?? "uppercase",
      "--heading-h4-transform": theme.headingTransforms?.h4 ?? "none",
      "--heading-h5-transform": theme.headingTransforms?.h5 ?? "none",
      "--heading-h6-transform": theme.headingTransforms?.h6 ?? "none",
      "--body-text-size": theme.bodyTextSize ?? "14px",
      "--card-radius": theme.cornerRadius ?? "15px"
    } as CSSProperties;
  };

  return (
      <section className="admin-stack">
        {toastMessage ? (
          <div
            className={`admin-toast${toastFadeOut ? " admin-toast--fade-out" : ""}`}
            role="status"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        ) : null}
        <header className="admin-header">
          <div className="admin-header-icon">
            <button type="button" className="admin-secondary" onClick={() => router.push("/admin")}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </div>
          <div className="admin-header-title">
            <h1>{t("admin.theme.managementTitle")}</h1>
            <p className="muted">{t("admin.theme.managementSubtitle")}</p>
          </div>
          <div className="admin-header-actions">
            {canCreateThemes ? (
              <button type="button" className="admin-primary" onClick={handleAddTheme}>
                <FontAwesomeIcon icon={faPlus} /> {t("admin.theme.actions.add")}
              </button>
            ) : null}
            <button type="button" className="admin-danger" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> {t("admin.logout")}
            </button>
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </header>

        {error ? <p className="admin-error">{error}</p> : null}

        {isLoading ? (
          <p className="muted">{t("admin.theme.loading")}</p>
        ) : (
          <div className="admin-grid">
            {themes.map((theme) => {
              const themeKey = theme.isNew ? theme.tempId ?? theme.name : theme.name;
              const isSaving = isSavingByName[theme.name] ?? false;
              const isExpanded = expandedByName[themeKey] ?? false;
              const canEdit =
                isAdmin || (theme.isPrivate && theme.createdBy === username) || theme.isNew;
              const headingSizes = theme.headingSizes ?? defaultHeadingSizes;
              const headingTransforms = theme.headingTransforms ?? defaultHeadingTransforms;
              const lightPreviewVars = {
                "--preview-background": theme.light.background,
                "--preview-surface": theme.light.surface,
                "--preview-text": theme.light.text,
                "--preview-muted": theme.light.muted,
                "--preview-primary": theme.light.primary,
                "--preview-accent": theme.light.accent,
                "--preview-border": theme.light.border,
                "--preview-shadow": theme.light.shadow,
                "--preview-text-shadow": theme.light.textShadow ?? "none"
              } as CSSProperties;
              const darkPreviewVars = {
                "--preview-background": theme.dark.background,
                "--preview-surface": theme.dark.surface,
                "--preview-text": theme.dark.text,
                "--preview-muted": theme.dark.muted,
                "--preview-primary": theme.dark.primary,
                "--preview-accent": theme.dark.accent,
                "--preview-border": theme.dark.border,
                "--preview-shadow": theme.dark.shadow,
                "--preview-text-shadow": theme.dark.textShadow ?? "none"
              } as CSSProperties;

              return (
                <section
                  key={themeKey}
                  className={`card admin-card admin-card-themed`}
                  style={getThemeVars(theme)}
                >
                  <div className="admin-card-header">
                    <h2>{theme.displayName}</h2>
                    {theme.isPrivate ? (
                      <span className="admin-status archived">{t("admin.theme.visibility.private")}</span>
                    ) : (
                      <span className="admin-status archived">{t("admin.theme.visibility.public")}</span>
                    )}
                    <div className="admin-card-controls">
                      <button
                        type="button"
                        className="admin-secondary admin-card-toggle"
                        onClick={() =>
                          setExpandedByName((prev) => ({
                            ...prev,
                            [themeKey]: !isExpanded
                          }))
                        }
                      >
                        {isExpanded ? t("admin.actions.hide") : t("admin.actions.show")}
                      </button>
                    </div>
                  </div>
                  {isExpanded ? (
                    <>
                      <div className="admin-form">
                        <label className="admin-field">
                          <span>{t("admin.theme.fields.name")}</span>
                          <input
                            value={theme.name}
                            readOnly={!theme.isNew}
                            onChange={(event) =>
                              updateThemeDraft(theme.name, (current) => ({
                                ...current,
                                name: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label className="admin-field">
                          <span>{t("admin.theme.fields.displayName")}</span>
                          <input
                            value={theme.displayName}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updateThemeDraft(theme.name, (current) => ({
                                ...current,
                                displayName: event.target.value
                              }))
                            }
                          />
                        </label>
                        <div className="admin-field">
                          <span>{t("admin.theme.fields.defaultMode")}</span>
                          <AdminSelect
                            value={theme.defaultMode ?? "light"}
                            options={defaultModeOptions}
                            onChange={(value) =>
                              updateThemeDraft(theme.name, (current) => ({
                                ...current,
                                defaultMode: value as "light" | "dark"
                              }))
                            }
                          />
                        </div>
                        {isAdmin ? (
                          <label className="admin-field admin-checkbox">
                            <span>{t("admin.theme.fields.privateTheme")}</span>
                            <input
                              type="checkbox"
                              checked={theme.isPrivate}
                              onChange={(event) =>
                                updateThemeDraft(theme.name, (current) => ({
                                  ...current,
                                  isPrivate: event.target.checked
                                }))
                              }
                            />
                          </label>
                        ) : (
                          <p className="muted">
                            {theme.isPrivate
                              ? t("admin.theme.hints.private")
                              : t("admin.theme.hints.public")}
                          </p>
                        )}
                        <div className="admin-nested-card admin-font-card">
                          <h4>{t("admin.theme.typography.title")}</h4>
                          <div className="admin-font-grid">
                            <label className="admin-field">
                              <span>{t("admin.theme.typography.bodyTextSize")}</span>
                              <input
                                value={theme.bodyTextSize ?? defaultBodyTextSize}
                                disabled={!canEdit}
                                onChange={(event) =>
                                  updateThemeDraft(theme.name, (current) => ({
                                    ...current,
                                    bodyTextSize: event.target.value
                                  }))
                                }
                              />
                            </label>
                            <label className="admin-field">
                              <span>{t("admin.theme.typography.cardRadius")}</span>
                              <input
                                value={theme.cornerRadius ?? defaultCornerRadius}
                                disabled={!canEdit}
                                onChange={(event) =>
                                  updateThemeDraft(theme.name, (current) => ({
                                    ...current,
                                    cornerRadius: event.target.value
                                  }))
                                }
                              />
                            </label>
                          </div>
                          <div className="admin-font-grid">
                            {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((heading) => (
                              <label key={heading} className="admin-field">
                                <span>
                                  {t("admin.theme.typography.headingSize").replace(
                                    "{heading}",
                                    heading.toUpperCase()
                                  )}
                                </span>
                                <input
                                  value={headingSizes[heading]}
                                  disabled={!canEdit}
                                  onChange={(event) =>
                                    updateThemeDraft(theme.name, (current) => ({
                                      ...current,
                                      headingSizes: {
                                        ...defaultHeadingSizes,
                                        ...(current.headingSizes ?? {}),
                                        [heading]: event.target.value
                                      }
                                    }))
                                  }
                                />
                              </label>
                            ))}
                          </div>
                          <div className="admin-font-grid">
                            {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((heading) => (
                              <div key={heading} className="admin-field">
                                <span>
                                  {t("admin.theme.typography.headingTransform").replace(
                                    "{heading}",
                                    heading.toUpperCase()
                                  )}
                                </span>
                                <AdminSelect
                                  value={headingTransforms[heading] ?? "none"}
                                  options={headingTransformOptions}
                                  onChange={(value) =>
                                    updateThemeDraft(theme.name, (current) => ({
                                      ...current,
                                      headingTransforms: {
                                        ...defaultHeadingTransforms,
                                        ...(current.headingTransforms ?? {}),
                                        [heading]: value
                                      }
                                    }))
                                  }
                                  disabled={!canEdit}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="admin-theme-fonts">
                          {(["base", "title", "subtitle"] as const).map((key) => {
                            const font = resolveFont(theme.fonts?.[key]);
                            const label =
                              key === "base"
                                ? t("admin.theme.fonts.base")
                                : key === "title"
                                  ? t("admin.theme.fonts.title")
                                  : t("admin.theme.fonts.heading");
                            return (
                              <div key={key} className="admin-nested-card admin-font-card">
                                <h4>{label}</h4>
                                <div className="admin-font-grid">
                                  <div className="admin-field">
                                    <span>{t("admin.theme.fonts.family")}</span>
                                    <AdminSelect
                                      value={font.family}
                                      options={fontOptions.map((option) => ({
                                        value: option.value,
                                        label: option.label
                                      }))}
                                      onChange={(value) => {
                                        const selected = fontOptions.find((option) => option.value === value);
                                        const src = selected?.src ?? "";
                                        const format = src ? getFontFormatFromFile(src) : "";
                                        updateThemeDraft(theme.name, (current) => {
                                          const normalizedFonts = normalizeFonts(current.fonts);
                                          return {
                                            ...current,
                                            fonts: {
                                              ...normalizedFonts,
                                              [key]: {
                                                ...normalizedFonts[key],
                                                family: value,
                                                src,
                                                format
                                              }
                                            }
                                          };
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="admin-field">
                                    <span>{t("admin.theme.fonts.weight")}</span>
                                    <AdminSelect
                                      value={font.weight ?? "normal"}
                                      options={fontWeightOptions}
                                      onChange={(value) =>
                                        updateThemeDraft(theme.name, (current) => {
                                          const normalizedFonts = normalizeFonts(current.fonts);
                                          return {
                                            ...current,
                                            fonts: {
                                              ...normalizedFonts,
                                              [key]: { ...normalizedFonts[key], weight: value }
                                            }
                                          };
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="admin-field">
                                    <span>{t("admin.theme.fonts.style")}</span>
                                    <AdminSelect
                                      value={font.style ?? "normal"}
                                      options={fontStyleOptions}
                                      onChange={(value) =>
                                        updateThemeDraft(theme.name, (current) => {
                                          const normalizedFonts = normalizeFonts(current.fonts);
                                          return {
                                            ...current,
                                            fonts: {
                                              ...normalizedFonts,
                                              [key]: { ...normalizedFonts[key], style: value }
                                            }
                                          };
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="admin-theme-grid">
                          <div className="admin-nested-card admin-theme-card" style={lightPreviewVars}>
                            <h4>{t("admin.theme.palette.light")}</h4>
                            <div className="admin-theme-inputs">
                              {([
                                "background",
                                "surface",
                                "text",
                                "muted",
                                "primary",
                                "accent",
                                "border"
                              ] as const).map((key) => (
                                <label key={key} className="admin-field">
                                  <span>{key}</span>
                                  <input
                                    type="color"
                                    value={theme.light[key]}
                                    disabled={!canEdit}
                                    onChange={(event) =>
                                      updateThemeDraft(theme.name, (current) => ({
                                        ...current,
                                        light: { ...current.light, [key]: event.target.value }
                                      }))
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                            <ShadowControl
                              label={t("admin.theme.palette.shadow")}
                              value={theme.light.shadow}
                              disabled={!canEdit}
                              labels={{
                                x: t("admin.theme.palette.shadowOffsetX"),
                                y: t("admin.theme.palette.shadowOffsetY"),
                                blur: t("admin.theme.palette.shadowBlur"),
                                opacity: t("admin.theme.palette.shadowOpacity"),
                                none: t("admin.theme.palette.shadowNone")
                              }}
                              onChange={(value) =>
                                updateThemeDraft(theme.name, (current) => ({
                                  ...current,
                                  light: { ...current.light, shadow: value }
                                }))
                              }
                            />
                            <ShadowControl
                              label={t("admin.theme.palette.textShadow")}
                              value={theme.light.textShadow ?? ""}
                              disabled={!canEdit}
                              labels={{
                                x: t("admin.theme.palette.shadowOffsetX"),
                                y: t("admin.theme.palette.shadowOffsetY"),
                                blur: t("admin.theme.palette.shadowBlur"),
                                opacity: t("admin.theme.palette.shadowOpacity"),
                                none: t("admin.theme.palette.shadowNone")
                              }}
                              onChange={(value) =>
                                updateThemeDraft(theme.name, (current) => ({
                                  ...current,
                                  light: { ...current.light, textShadow: value }
                                }))
                              }
                            />
                            <div className="admin-theme-preview">
                              <div className="admin-theme-preview-surface">
                                <div className="admin-theme-preview-typography">
                                  <h1>{t("admin.theme.preview.sampleTitle")}</h1>
                                  <h2>{t("admin.theme.preview.sampleSubtitle")}</h2>
                                  <h3>{t("admin.theme.preview.sampleParagraphTitle")}</h3>
                                  <h4>{t("admin.theme.preview.sampleHeading")}</h4>
                                  <h5>{t("admin.theme.preview.sampleSubheading")}</h5>
                                  <h6>{t("admin.theme.preview.sampleParagraphHeading")}</h6>
                                  <p>{t("admin.theme.preview.sampleBody")}</p>
                                </div>
                                <div className="admin-theme-preview-radius">
                                  {t("admin.theme.preview.sampleRadius")}
                                </div>
                                <p className="admin-theme-preview-muted">
                                  {t("admin.theme.preview.sampleMuted")}
                                </p>
                                <div className="admin-theme-preview-actions">
                                  <button type="button" className="admin-theme-preview-primary">
                                    {t("admin.theme.preview.samplePrimary")}
                                  </button>
                                  <button type="button" className="admin-theme-preview-accent">
                                    {t("admin.theme.preview.sampleAccent")}
                                  </button>
                                </div>
                                <div className="admin-theme-preview-chip">
                                  {t("admin.theme.preview.sampleBorder")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            className="admin-nested-card admin-theme-card admin-theme-card-dark"
                            style={darkPreviewVars}
                          >
                            <h4>{t("admin.theme.palette.dark")}</h4>
                            <div className="admin-theme-inputs">
                              {([
                                "background",
                                "surface",
                                "text",
                                "muted",
                                "primary",
                                "accent",
                                "border"
                              ] as const).map((key) => (
                                <label key={key} className="admin-field">
                                  <span>{key}</span>
                                  <input
                                    type="color"
                                    value={theme.dark[key]}
                                    disabled={!canEdit}
                                    onChange={(event) =>
                                      updateThemeDraft(theme.name, (current) => ({
                                        ...current,
                                        dark: { ...current.dark, [key]: event.target.value }
                                      }))
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                            <ShadowControl
                              label={t("admin.theme.palette.shadow")}
                              value={theme.dark.shadow}
                              disabled={!canEdit}
                              labels={{
                                x: t("admin.theme.palette.shadowOffsetX"),
                                y: t("admin.theme.palette.shadowOffsetY"),
                                blur: t("admin.theme.palette.shadowBlur"),
                                opacity: t("admin.theme.palette.shadowOpacity"),
                                none: t("admin.theme.palette.shadowNone")
                              }}
                              onChange={(value) =>
                                updateThemeDraft(theme.name, (current) => ({
                                  ...current,
                                  dark: { ...current.dark, shadow: value }
                                }))
                              }
                            />
                            <ShadowControl
                              label={t("admin.theme.palette.textShadow")}
                              value={theme.dark.textShadow ?? ""}
                              disabled={!canEdit}
                              labels={{
                                x: t("admin.theme.palette.shadowOffsetX"),
                                y: t("admin.theme.palette.shadowOffsetY"),
                                blur: t("admin.theme.palette.shadowBlur"),
                                opacity: t("admin.theme.palette.shadowOpacity"),
                                none: t("admin.theme.palette.shadowNone")
                              }}
                              onChange={(value) =>
                                updateThemeDraft(theme.name, (current) => ({
                                  ...current,
                                  dark: { ...current.dark, textShadow: value }
                                }))
                              }
                            />
                            <div className="admin-theme-preview">
                              <div className="admin-theme-preview-surface">
                                <div className="admin-theme-preview-typography">
                                  <h1>{t("admin.theme.preview.sampleTitle")}</h1>
                                  <h2>{t("admin.theme.preview.sampleSubtitle")}</h2>
                                  <h3>{t("admin.theme.preview.sampleParagraphTitle")}</h3>
                                  <h4>{t("admin.theme.preview.sampleHeading")}</h4>
                                  <h5>{t("admin.theme.preview.sampleSubheading")}</h5>
                                  <h6>{t("admin.theme.preview.sampleParagraphHeading")}</h6>
                                  <p>{t("admin.theme.preview.sampleBody")}</p>
                                </div>
                                <div className="admin-theme-preview-radius">
                                  {t("admin.theme.preview.sampleRadius")}
                                </div>
                                <p className="admin-theme-preview-muted">
                                  {t("admin.theme.preview.sampleMuted")}
                                </p>
                                <div className="admin-theme-preview-actions">
                                  <button type="button" className="admin-theme-preview-primary">
                                    {t("admin.theme.preview.samplePrimary")}
                                  </button>
                                  <button type="button" className="admin-theme-preview-accent">
                                    {t("admin.theme.preview.sampleAccent")}
                                  </button>
                                </div>
                                <div className="admin-theme-preview-chip">
                                  {t("admin.theme.preview.sampleBorder")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {canEdit ? (
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-primary"
                            disabled={isSaving}
                            onClick={() => handleSaveTheme(theme)}
                          >
                            <FontAwesomeIcon icon={faSave} /> {t("admin.theme.actions.save")}
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              className="admin-danger"
                              disabled={isSaving}
                              onClick={() => handleDeleteTheme(theme)}
                            >
                              <FontAwesomeIcon icon={faTrash} /> {t("admin.theme.actions.delete")}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <p className="muted">{t("admin.theme.readonlyHint")}</p>
                      )}
                    </>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </section>
  );
}

export default function AdminThemesPage() {
  return (
    <ThemeProvider>
      <AdminThemesContent />
    </ThemeProvider>
  );
}
