"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faSave, faArchive, faPlus, faTrash, faEye, faEyeSlash, faSignOutAlt, faObjectGroup, faPaperclip, faCalendar, faMoneyBills, faLegal, faUsers, faPaintBrush, faHomeLgAlt, faPlane, faUpload, faRotateLeft, faLink } from "@fortawesome/free-solid-svg-icons";
import type {
  LocalizedString,
  PropertyDto,
  PropertyExperienceItemDto,
  PropertyPlacesPageDto,
  PropertyPlacesSectionDto,
  RentalBookingDto,
  RentalDto,
  ThemeDto
} from "@/lib/types";
import { getRentalUnits } from "@/lib/types";
import type { IcalAvailabilityRange } from "@/lib/adminApi";
import { resolveImageUrl } from "@/lib/api";
import { resolveTheme } from "@/lib/theme";
import AdminSelect from "@/components/AdminSelect";
import FacilityIconPicker from "@/components/FacilityIconPicker";
import LanguageSelect from "@/components/LanguageSelect";
import LocalizedRichTextField from "@/components/LocalizedRichTextField";
import LocalizedTextField from "@/components/LocalizedTextField";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { resolveLocalizedText, setLocalizedValue } from "@/lib/i18n";
import {
  allSupportedLanguageCodes,
  defaultListingLanguageCodes,
  getLanguageDirection,
  getListingLanguageOptions,
  isSupportedLanguage,
  supportedLanguages
} from "@/lib/i18n/languages";
import { useTranslations } from "@/lib/i18n/useLanguage";
import { useAdminSessionRefresh } from "@/lib/useAdminSessionRefresh";
import {
  archiveProperty,
  AuthError,
  clearToken,
  createProperty,
  getAdminProperties,
  getIcalAvailability,
  getThemes,
  getStoredToken,
  getStoredUser,
  PermissionError,
  publishProperty,
  refreshSession,
  lookupFlightArrival,
  revertProperty,
  restoreProperty,
  storeSession,
  updateProperty,
  type ThemeLibrary
} from "@/lib/adminApi";

type PropertyDraft = PropertyDto;
type HeroTransition = NonNullable<PropertyDto["heroSettings"]>["transition"];

const createPlacesSectionId = () =>
  `places-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const createBookingId = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join("");
};

type AdminThemeVars = CSSProperties & Record<string, string>;
type ThemeFont = NonNullable<NonNullable<PropertyDto["theme"]>["fonts"]>["base"];

const fallbackThemeVars: AdminThemeVars = {
  "--admin-surface": "var(--surface, #ffffff)",
  "--admin-text": "var(--text, #0f172a)",
  "--admin-muted": "var(--muted, #64748b)",
  "--admin-border": "var(--border, #e2e8f0)",
  "--admin-shadow": "var(--shadow, 0 10px 30px rgba(15, 23, 42, 0.08))",
  "--admin-text-shadow": "none",
  "--admin-accent": "var(--accent, #1d4ed8)",
  "--admin-primary": "var(--primary, #1d4ed8)",
  "--font-base-family": "system-ui",
  "--font-base-weight": "normal",
  "--font-base-style": "normal",
  "--font-title-family": "system-ui",
  "--font-title-weight": "normal",
  "--font-title-style": "normal",
  "--font-subtitle-family": "system-ui",
  "--font-subtitle-weight": "normal",
  "--font-subtitle-style": "normal",
  "--heading-h1-size": "2.5rem",
  "--heading-h2-size": "2.25rem",
  "--heading-h3-size": "2rem",
  "--heading-h4-size": "2.25rem",
  "--heading-h5-size": "2rem",
  "--heading-h6-size": "1.75rem",
  "--heading-h1-transform": "uppercase",
  "--heading-h2-transform": "uppercase",
  "--heading-h3-transform": "uppercase",
  "--heading-h4-transform": "none",
  "--heading-h5-transform": "none",
  "--heading-h6-transform": "none",
  "--body-text-size": "14px",
  "--card-radius": "18px"
};

function getProviderLabel(url: string, t: (key: string) => string) {
  const lower = url.toLowerCase();
  if (lower.includes("airbnb.")) {
    return t("admin.bookingSources.airbnb");
  }
  if (lower.includes("booking.com")) {
    return t("admin.bookingSources.bookingCom");
  }
  if (lower.includes("vrbo.")) {
    return t("admin.bookingSources.vrbo");
  }
  return t("admin.bookingSources.external");
}

function getThemeVars(
  themeSource: ThemeDto | ThemeLibrary | null | undefined,
  mode: "light" | "dark"
): AdminThemeVars {
  if (!themeSource) {
    return fallbackThemeVars;
  }

  const resolved = resolveTheme(themeSource as ThemeDto);
  const palette = mode === "dark" ? resolved.dark : resolved.light;
  const fonts = resolved.fonts;
  const headingSizes = resolved.headingSizes;
  const headingTransforms = resolved.headingTransforms;

  return {
    "--admin-surface": palette.surface,
    "--admin-text": palette.text,
    "--admin-muted": palette.muted,
    "--admin-border": palette.border,
    "--admin-shadow": palette.shadow,
    "--admin-text-shadow": palette.textShadow ?? "none",
    "--admin-accent": palette.accent,
    "--admin-primary": palette.primary,
    "--font-base-family": fonts?.base.family ?? "system-ui",
    "--font-base-weight": fonts?.base.weight ?? "normal",
    "--font-base-style": fonts?.base.style ?? "normal",
    "--font-title-family": fonts?.title.family ?? "system-ui",
    "--font-title-weight": fonts?.title.weight ?? "normal",
    "--font-title-style": fonts?.title.style ?? "normal",
    "--font-subtitle-family": fonts?.subtitle.family ?? "system-ui",
    "--font-subtitle-weight": fonts?.subtitle.weight ?? "normal",
    "--font-subtitle-style": fonts?.subtitle.style ?? "normal",
    "--heading-h1-size": headingSizes?.h1 ?? "2.8rem",
    "--heading-h2-size": headingSizes?.h2 ?? "2.2rem",
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
    "--body-text-size": resolved.bodyTextSize ?? "14px",
    "--card-radius": resolved.cornerRadius ?? "18px"
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { setLanguage, t } = useTranslations();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PropertyDraft>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [createId, setCreateId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createStatus, setCreateStatus] = useState("rental");
  const [createListingLanguages, setCreateListingLanguages] = useState<string[]>(defaultListingLanguageCodes);
  const [authExpired, setAuthExpired] = useState(false);
  useAdminSessionRefresh({ onExpired: () => setAuthExpired(true) });
  const [icalAvailabilityById, setIcalAvailabilityById] = useState<
    Record<string, IcalAvailabilityRange[]>
  >({});
  const [icalLoadingById, setIcalLoadingById] = useState<Record<string, boolean>>({});
  const [icalErrorById, setIcalErrorById] = useState<Record<string, string>>({});
  const [themes, setThemes] = useState<ThemeLibrary[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastFadeOut, setToastFadeOut] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const fontDefs: ThemeFont[] = [];
    properties.forEach((property) => {
      const draft = drafts[property.id];
      const draftThemeName = draft?.themeName ?? property.themeName ?? property.theme?.name ?? "";
      const selectedTheme = draftThemeName
        ? themes.find((item) => item.name === draftThemeName)
        : null;
      const fonts = selectedTheme?.fonts ?? draft?.theme?.fonts ?? property.theme?.fonts;
      if (!fonts) {
        return;
      }
      fontDefs.push(fonts.base, fonts.title, fonts.subtitle);
    });

    const rules = fontDefs
      .filter((font) => font?.src)
      .map((font) => {
        const format = font.format ? ` format("${font.format}")` : "";
        const weight = font.weight ?? "normal";
        const style = font.style ?? "normal";
        return `@font-face { font-family: "${font.family}"; src: url("${font.src}")${format}; font-weight: ${weight}; font-style: ${style}; }`;
      });
    const uniqueRules = Array.from(new Set(rules));

    const styleId = "admin-theme-font-faces";
    let styleTag = document.querySelector<HTMLStyleElement>(`#${styleId}`);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = uniqueRules.join("\n");
  }, [properties, drafts, themes]);

  const token = useMemo(() => getStoredToken(), []);
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
  const canViewFinancials = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.some((role) =>
      ["admin", "property-owner", "property_owner", "propertyowner", "owner"].includes(role)
    );
  }, [currentUser]);
  const canManageThemes = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    const roles = (currentUser.roles ?? []).map((role) => role.toLowerCase());
    return !roles.includes("property-manager");
  }, [currentUser]);
  const canEditProperties = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.includes("admin")
      || roles.includes("agent")
      || roles.includes("property-owner")
      || roles.includes("property_owner")
      || roles.includes("propertyowner")
      || roles.includes("owner");
  }, [currentUser]);
  const canAddProperties = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.includes("admin")
      || roles.includes("property-owner")
      || roles.includes("property_owner")
      || roles.includes("propertyowner")
      || roles.includes("owner")
      || roles.includes("agent");
  }, [currentUser]);

  const mergeParagraphsToItemText = useCallback(
    (paragraphs: Array<string | LocalizedString> | undefined) => {
      if (!paragraphs || paragraphs.length === 0) {
        return null;
      }
      const merged: LocalizedString = {};
      supportedLanguages.forEach(({ code }) => {
        const parts = paragraphs
          .map((paragraph) => resolveLocalizedText(paragraph, code))
          .filter((text) => Boolean(text && text.trim().length > 0));
        if (parts.length > 0) {
          merged[code] = parts.join("\n\n");
        }
      });
      return Object.keys(merged).length > 0 ? merged : null;
    },
    []
  );

  const normalizeExperienceItems = useCallback(
    (items?: PropertyExperienceItemDto[]) =>
      (items ?? []).map((item) => {
        if (item.itemText) {
          return item;
        }
        const legacyItemText = (item as { ItemText?: LocalizedString }).ItemText;
        if (legacyItemText) {
          return { ...item, itemText: legacyItemText };
        }
        const legacyParagraphs = (item as { paragraphs?: Array<string | LocalizedString> }).paragraphs;
        if (!legacyParagraphs || legacyParagraphs.length === 0) {
          return item;
        }
        const itemText = mergeParagraphsToItemText(legacyParagraphs);
        return itemText ? { ...item, itemText } : item;
      }),
    [mergeParagraphsToItemText]
  );

  const normalizePlacesSections = useCallback(
    (sections?: PropertyPlacesSectionDto[] | null) =>
      (sections ?? []).map((section) => ({
        ...section,
        id: section.id?.trim() || createPlacesSectionId(),
        title: section.title ?? "",
        description: section.description ?? "",
        icon: section.icon ?? "",
        color: section.color ?? "",
        categoryValue: section.categoryValue ?? ""
      })),
    []
  );

  const normalizePlacesPage = useCallback(
    (source: PropertyDto): PropertyPlacesPageDto => {
      if (!source.places) {
        return { pageTitle: "", description: "", sections: [], items: [] };
      }
      return {
        ...source.places,
        pageTitle: source.places.pageTitle ?? "",
        description: source.places.description ?? "",
        sections: normalizePlacesSections(source.places.sections),
        items: normalizeExperienceItems(source.places.items)
      };
    },
    [normalizeExperienceItems, normalizePlacesSections]
  );

  const loadProperties = async () => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (authExpired) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await getAdminProperties(token, { includeAllLanguages: true });
      setProperties(data);
      setDrafts((prev) => {
        const nextDrafts: Record<string, PropertyDraft> = { ...prev };
        data.forEach((property) => {
          const resolvedTheme = resolveTheme(property.theme);
          const listingLanguages =
            property.listingLanguages?.length ? property.listingLanguages : defaultListingLanguageCodes;
          if (!nextDrafts[property.id]) {
            nextDrafts[property.id] = {
              ...property,
              listingLanguages,
              places: normalizePlacesPage(property),
              themeName: property.themeName ?? property.theme?.name ?? "",
              theme: {
                name: property.theme?.name ?? property.id,
                defaultMode: resolvedTheme.defaultMode,
                light: resolvedTheme.light,
                dark: resolvedTheme.dark
              }
            };
          } else if (!nextDrafts[property.id].places) {
            const currentDraft = nextDrafts[property.id];
            nextDrafts[property.id] = {
              ...currentDraft,
              places: normalizePlacesPage(currentDraft)
            };
          }
        });
        return nextDrafts;
      });
      try {
        const themesData = await getThemes(token);
        setThemes(themesData);
      } catch (themeError) {
        setError(
          themeError instanceof Error ? themeError.message : t("admin.errors.loadThemes")
        );
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthExpired(true);
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.errors.permissionView"));
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.errors.loadProperties"));
    } finally {
      setIsLoading(false);
    }
  };

  const icalStateKey = (propertyId: string, unitIndex: number) => `${propertyId}-${unitIndex}`;

  const fetchIcalAvailability = async (propertyId: string, unitIndex?: number) => {
    if (!token) {
      return;
    }
    const key = icalStateKey(propertyId, unitIndex ?? 0);
    setIcalLoadingById((prev) => ({ ...prev, [key]: true }));
    setIcalErrorById((prev) => ({ ...prev, [key]: "" }));

    try {
      const ranges = await getIcalAvailability(token, propertyId, unitIndex);
      setIcalAvailabilityById((prev) => ({ ...prev, [key]: ranges }));
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthExpired(true);
        return;
      }
      setIcalErrorById((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : t("admin.errors.loadIcal")
      }));
    } finally {
      setIcalLoadingById((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    void loadProperties();
  }, []);

  useEffect(() => {
    if (!authExpired) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/admin/login");
    }, 60_000);

    return () => window.clearTimeout(timeout);
  }, [authExpired, router]);

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

  const handleArchiveToggle = async (property: PropertyDto) => {
    if (!token) {
      return;
    }
    if (!canEditProperties) {
      setError(t("admin.errors.permissionUpdate"));
      return;
    }
    setError("");
    try {
      if (property.archived) {
        await restoreProperty(token, property.id);
      } else {
        await archiveProperty(token, property.id);
      }
      await loadProperties();
      setToastMessage(
        property.archived ? t("admin.toast.propertyActivated") : t("admin.toast.propertyArchived")
      );
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthExpired(true);
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.errors.updateFailed"));
    }
  };

  const handleSave = async (property: PropertyDto) => {
    if (!token) {
      return;
    }
    if (!canEditProperties) {
      setError(t("admin.errors.permissionUpdate"));
      return;
    }
    const draft = drafts[property.id];
    if (!draft) {
      return;
    }
    setError("");
    const placesPayload = draft.places ?? normalizePlacesPage(draft);
    const buildPayload = () => ({
      name: draft.name,
      status: draft.status.trim(),
      summary: draft.summary ?? null,
      heroImages: draft.heroImages ?? [],
      heroSettings: draft.heroSettings ?? null,
      pages: draft.pages ?? [],
      places: placesPayload ?? null,
      themeName: draft.themeName ?? null,
      theme: draft.themeName ? null : draft.theme ?? null,
      facts: draft.facts ?? null,
      externalLinks: draft.externalLinks ?? [],
      location: draft.location ?? null,
      facilities: draft.facilities ?? [],
      pdfs: draft.pdfs ?? [],
      salesParticulars: draft.salesParticulars ?? null,
      rentalUnits: getRentalUnits(draft).length ? getRentalUnits(draft) : undefined,
      guestInfo: draft.guestInfo ?? null,
      listingLanguages: draft.listingLanguages ?? defaultListingLanguageCodes
    });
    try {
      const activeToken = getStoredToken() ?? token;
      await updateProperty(activeToken, property.id, buildPayload());
      await loadProperties();
      setToastMessage(t("admin.toast.propertySaved"));
    } catch (err) {
      if (err instanceof AuthError) {
        try {
          const session = await refreshSession(getStoredToken() ?? token);
          storeSession(session);
          await updateProperty(session.token, property.id, buildPayload());
          await loadProperties();
          setToastMessage(t("admin.toast.propertySaved"));
          return;
        } catch (refreshError) {
          if (refreshError instanceof AuthError) {
            setAuthExpired(true);
            return;
          }
          setError(
            refreshError instanceof Error ? refreshError.message : t("admin.errors.updateFailed")
          );
          return;
        }
      }
      setError(err instanceof Error ? err.message : t("admin.errors.updateFailed"));
    }
  };

  const handlePublish = async (property: PropertyDto) => {
    if (!token) {
      return;
    }
    if (!canEditProperties) {
      setError(t("admin.errors.permissionPublish"));
      return;
    }
    setError("");
    try {
      await publishProperty(token, property.id);
      await loadProperties();
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthExpired(true);
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.errors.publishFailed"));
    }
  };

  const handleRevert = async (property: PropertyDto) => {
    if (!token) {
      return;
    }
    if (!canEditProperties) {
      setError(t("admin.errors.permissionRevert"));
      return;
    }
    setError("");
    try {
      await revertProperty(token, property.id);
      await loadProperties();
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthExpired(true);
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.errors.revertFailed"));
    }
  };

  const handleCreate = async (_event: React.FormEvent<HTMLFormElement>) => {
    if (!token) {
      return;
    }
    if (!canAddProperties) {
      setError(t("admin.errors.permissionAdd"));
      return;
    }
    setError("");
    try {
      await createProperty(token, {
        id: createId.trim(),
        name: createName.trim(),
        status: createStatus.trim(),
        listingLanguages: createListingLanguages.length ? createListingLanguages : defaultListingLanguageCodes
      });
      setCreateId("");
      setCreateName("");
      setCreateStatus("rental");
      setCreateListingLanguages(defaultListingLanguageCodes);
      await loadProperties();
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthExpired(true);
        return;
      }
      setError(err instanceof Error ? err.message : t("admin.errors.createFailed"));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("languageOverride");
    }
    clearToken();
    router.push("/admin/login");
  };

  return (
    <ThemeProvider>
      <AdminPageBody
        onLogout={handleLogout}
        token={token}
        properties={properties}
        drafts={drafts}
        setDrafts={setDrafts}
        icalAvailabilityById={icalAvailabilityById}
        icalLoadingById={icalLoadingById}
        icalErrorById={icalErrorById}
        onFetchIcalAvailability={fetchIcalAvailability}
        icalStateKey={icalStateKey}
        error={error}
        isLoading={isLoading}
        authExpired={authExpired}
        onExtendSession={() => router.push("/admin/login")}
        currentUser={currentUser}
        createId={createId}
        setCreateId={setCreateId}
        createName={createName}
        setCreateName={setCreateName}
        createStatus={createStatus}
        setCreateStatus={setCreateStatus}
        createListingLanguages={createListingLanguages}
        setCreateListingLanguages={setCreateListingLanguages}
        onCreate={handleCreate}
        onArchiveToggle={handleArchiveToggle}
        onSave={handleSave}
        canViewFinancials={canViewFinancials}
        canManageThemes={canManageThemes}
        canEditProperties={canEditProperties}
        canAddProperties={canAddProperties}
        onPublish={handlePublish}
        onRevert={handleRevert}
        themes={themes}
        toastMessage={toastMessage}
        toastFadeOut={toastFadeOut}
        setToastMessage={setToastMessage}
      />
    </ThemeProvider>
  );
}

type AdminPageBodyProps = {
  onLogout: () => void;
  token: string | null;
  properties: PropertyDto[];
  drafts: Record<string, PropertyDraft>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, PropertyDraft>>>;
  icalAvailabilityById: Record<string, IcalAvailabilityRange[]>;
  icalLoadingById: Record<string, boolean>;
  icalErrorById: Record<string, string>;
  onFetchIcalAvailability: (propertyId: string, unitIndex?: number) => void;
  icalStateKey: (propertyId: string, unitIndex: number) => string;
  error: string;
  isLoading: boolean;
  authExpired: boolean;
  onExtendSession: () => void;
  currentUser: ReturnType<typeof getStoredUser>;
  createId: string;
  setCreateId: React.Dispatch<React.SetStateAction<string>>;
  createName: string;
  setCreateName: React.Dispatch<React.SetStateAction<string>>;
  createStatus: string;
  setCreateStatus: React.Dispatch<React.SetStateAction<string>>;
  createListingLanguages: string[];
  setCreateListingLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onArchiveToggle: (property: PropertyDto) => void;
  onSave: (property: PropertyDto) => void;
  canViewFinancials: boolean;
  canManageThemes: boolean;
  canEditProperties: boolean;
  canAddProperties: boolean;
  onPublish: (property: PropertyDto) => void;
  onRevert: (property: PropertyDto) => void;
  themes: ThemeLibrary[];
  toastMessage: string | null;
  toastFadeOut: boolean;
  setToastMessage: (message: string | null) => void;
};

function AdminPageBody({
  onLogout,
  token,
  properties,
  drafts,
  setDrafts,
  icalAvailabilityById,
  icalLoadingById,
  icalErrorById,
  onFetchIcalAvailability,
  icalStateKey,
  error,
  isLoading,
  authExpired,
  onExtendSession,
  currentUser,
  createId,
  setCreateId,
  createName,
  setCreateName,
  createStatus,
  setCreateStatus,
  createListingLanguages,
  setCreateListingLanguages,
  onCreate,
  onArchiveToggle,
  onSave,
  canViewFinancials,
  canManageThemes,
  canEditProperties,
  canAddProperties,
  onPublish,
  onRevert,
  themes,
  toastMessage,
  toastFadeOut,
  setToastMessage
}: AdminPageBodyProps) {
  const router = useRouter();
  const { mode } = useTheme();
  const { language, setLanguage, t } = useTranslations();
  const roleList = useMemo(
    () => (currentUser?.roles ?? []).map((role) => role.toLowerCase()),
    [currentUser]
  );
  const isPropertyManager = roleList.includes("property-manager");
  const isSinglePropertyManager = isPropertyManager && properties.length === 1;
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandedBookingsByKey, setExpandedBookingsByKey] = useState<Record<string, boolean>>({});
  const [activeTabById, setActiveTabById] = useState<Record<string, string>>({});
  const [activePageIndexById, setActivePageIndexById] = useState<Record<string, number>>({});
  const [activeExperienceIndexByKey, setActiveExperienceIndexByKey] = useState<
    Record<string, number>
  >({});
  const [activePlacesSectionIndexByKey, setActivePlacesSectionIndexByKey] = useState<
    Record<string, number>
  >({});
  const [activeGuestEmergencyContactIndexByKey, setActiveGuestEmergencyContactIndexByKey] =
    useState<Record<string, number>>({});
  const [activeGuestSafetyAdviceIndexByKey, setActiveGuestSafetyAdviceIndexByKey] = useState<
    Record<string, number>
  >({});
  const [activeRentalUnitById, setActiveRentalUnitById] = useState<Record<string, number>>({});
  const [showBookingGapsById, setShowBookingGapsById] = useState<Record<string, boolean>>({});
  const [flightLookupByKey, setFlightLookupByKey] = useState<
    Record<string, { loading: boolean; error?: string }>
  >({});
  const [facilityFocus, setFacilityFocus] = useState<{
    groupIndex: number;
    itemIndex: number;
  } | null>(null);
  const [activeFacilityIconPicker, setActiveFacilityIconPicker] = useState<{
    groupIndex: number;
    /** null = group icon; number = item index (item has no icon, picker unused for items) */
    itemIndex: number | null;
  } | null>(null);
  const [activePlacesIconPicker, setActivePlacesIconPicker] = useState<{
    propertyId: string;
    sectionIndex: number;
  } | null>(null);
  const [activeSectionIndexByKey, setActiveSectionIndexByKey] = useState<
    Record<string, number>
  >({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [iconLoadError, setIconLoadError] = useState<string | null>(null);
  const listingTypeOptions = useMemo(
    () => [
      { value: "rental", label: t("admin.listingTypes.rental") },
      { value: "sale", label: t("admin.listingTypes.sale") },
      { value: "both", label: t("admin.listingTypes.both") }
    ],
    [t]
  );
  const bookingSourceOptions = useMemo(
    () => [
      { value: "Friend", label: t("admin.bookingSources.friend") },
      { value: "Relative", label: t("admin.bookingSources.relative") },
      { value: "AirBnb", label: t("admin.bookingSources.airbnb") }
    ],
    [t]
  );
  const fallbackFacilityIconOptions = useMemo(
    () => [
      { value: "solid:house", label: t("admin.facilityIcons.house") },
      { value: "solid:bath", label: t("admin.facilityIcons.bath") },
      { value: "solid:bed", label: t("admin.facilityIcons.bed") },
      { value: "solid:tv", label: t("admin.facilityIcons.tv") },
      { value: "solid:wifi", label: t("admin.facilityIcons.wifi") },
      { value: "solid:baby", label: t("admin.facilityIcons.baby") },
      { value: "solid:snowflake", label: t("admin.facilityIcons.snowflake") },
      { value: "solid:kit-medical", label: t("admin.facilityIcons.firstAid") },
      { value: "solid:utensils", label: t("admin.facilityIcons.utensils") },
      { value: "solid:sun", label: t("admin.facilityIcons.sun") },
      { value: "solid:car", label: t("admin.facilityIcons.car") },
      { value: "solid:concierge-bell", label: t("admin.facilityIcons.concierge") },
      { value: "solid:mountain-sun", label: t("admin.facilityIcons.mountainSun") },
      { value: "solid:xmarks-lines", label: t("admin.facilityIcons.fenced") },
      { value: "regular:circle-check", label: t("admin.facilityIcons.check") }
    ],
    [t]
  );
  const [hasLoadedIcons, setHasLoadedIcons] = useState(false);
  const [facilityIconOptions, setFacilityIconOptions] = useState(
    fallbackFacilityIconOptions
  );
  const getRoleLabel = useCallback(
    (role: string) => {
      const normalized = role.trim().toLowerCase().replace(/_/g, "-");
      const canonical = normalized === "propertyowner"
        ? "property-owner"
        : normalized === "propertymanager"
          ? "property-manager"
          : normalized;
      const key = `admin.roles.${canonical}`;
      const translated = t(key);
      if (translated !== key) {
        return translated;
      }
      return canonical
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    },
    [t]
  );
  const tabOptions = useMemo(
    () => [
      { value: "overview", label: t("admin.tabs.overview") },
      { value: "hero", label: t("admin.tabs.hero") },
      { value: "pages", label: t("admin.tabs.pages") },
      { value: "places", label: t("admin.tabs.places") },
      { value: "theme", label: t("admin.tabs.theme") },
      { value: "facts", label: t("admin.tabs.facts") },
      { value: "links", label: t("admin.links.title") },
      { value: "location", label: t("admin.tabs.location") },
      { value: "facilities", label: t("admin.tabs.facilities") },
      { value: "pdfs", label: t("admin.pdfs.title") },
      { value: "salesRental", label: t("admin.tabs.salesRental") },
      { value: "bookings", label: t("admin.tabs.bookings") },
      { value: "guestInfo", label: t("admin.tabs.guestInfo") }
    ],
    [t]
  );
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const normalizeIconValue = useCallback((value: string | undefined) => {
    const raw = value?.trim() || "circle";
    return raw.includes(":") ? raw : `regular:${raw}`;
  }, []);

  const getIconClassName = useCallback((value: string | undefined) => {
    const normalized = normalizeIconValue(value);
    const [style, name] = normalized.split(":");
    const styleClass =
      style === "brands" ? "fa-brands" : style === "regular" ? "fa-regular" : "fa-regular";
    return `${styleClass} fa-${name || "circle"}`;
  }, [normalizeIconValue]);

  const normalizeFacilities = useCallback(
    (facilityGroups: PropertyDto["facilities"]) =>
      (facilityGroups ?? []).map((group) => ({
        ...group,
        icon: group.icon != null ? normalizeIconValue(group.icon) : "regular:circle",
        items: (group.items ?? []).map((item) =>
          typeof item === "string" ? { text: item } : { text: (item as { text?: string | Record<string, string> }).text ?? "" }
        )
      })),
    [normalizeIconValue]
  );

  useEffect(() => {
    let isMounted = true;

    const loadIcons = async () => {
      try {
        setIconLoadError(null);
        const response = await fetch("/fontawesome-icons.json", {
          cache: "no-store"
        });
        if (!response.ok) {
          if (isMounted) {
            setIconLoadError(t("admin.facilityIcons.errors.loadFailed"));
          }
          return;
        }
        const text = await response.text();
        const data = JSON.parse(text) as Record<string, unknown>;
        const maybeIcons = (data as { icons?: Record<string, unknown> }).icons;
        const resolveIconSource = () => {
          if (!maybeIcons || typeof maybeIcons !== "object") {
            return data;
          }
          const values = Object.values(maybeIcons);
          if (values.length === 0) {
            return data;
          }
          const sample = values[0];
          const sampleIsIcon =
            !!sample &&
            typeof sample === "object" &&
            ("free" in (sample as object) || "styles" in (sample as object));
          return sampleIsIcon ? (maybeIcons as Record<string, unknown>) : data;
        };
        const iconSource = resolveIconSource();
        if (!iconSource || typeof iconSource !== "object") {
          if (isMounted) {
            setIconLoadError(t("admin.facilityIcons.errors.invalidFormat"));
          }
          return;
        }
        const options = Object.entries(iconSource)
          .flatMap(([name, iconData]) => {
            const freeStyles = (iconData as { free?: string[] }).free ?? [];
            if (!Array.isArray(freeStyles) || freeStyles.length === 0) {
              return [];
            }
            const label = (iconData as { label?: string }).label ?? name;
            return freeStyles.map((style) => ({
              value: `${style}:${name}`,
              label: `${label} (${style})`
            }));
          })
          .sort((left, right) => left.label.localeCompare(right.label));
        if (!isMounted) {
          return;
        }
        if (options.length === 0) {
          setIconLoadError(t("admin.facilityIcons.errors.noFreeIcons"));
          return;
        }
        setFacilityIconOptions(options);
        setHasLoadedIcons(true);
      } catch {
        if (isMounted) {
          setIconLoadError(t("admin.facilityIcons.errors.loadFailed"));
        }
      }
    };

    loadIcons();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (!hasLoadedIcons) {
      setFacilityIconOptions(fallbackFacilityIconOptions);
    }
  }, [fallbackFacilityIconOptions, hasLoadedIcons]);

  useEffect(() => {
    setExpandedCards((prev) => {
      if (Object.keys(prev).length > 0) {
        return prev;
      }
      const initial: Record<string, boolean> = {};
      properties.forEach((property) => {
        initial[property.id] = false;
      });
      return initial;
    });
  }, [properties]);

  useEffect(() => {
    setActiveTabById((prev) => {
      const next = { ...prev };
      properties.forEach((property) => {
        if (!next[property.id]) {
          next[property.id] = isPropertyManager ? "bookings" : "overview";
        }
      });
      return next;
    });
  }, [properties, isPropertyManager]);

  useEffect(() => {
    setActivePageIndexById((prev) => {
      const next = { ...prev };
      properties.forEach((property) => {
        if (next[property.id] === undefined) {
          next[property.id] = 0;
        }
      });
      return next;
    });
  }, [properties]);

  const getSectionKey = useCallback(
    (propertyId: string, pageIndex: number) => `${propertyId}::${pageIndex}`,
    []
  );
  const getExperienceKey = useCallback(
    (propertyId: string, kind: "places") => `${propertyId}::${kind}`,
    []
  );
  const getPlacesSectionKey = useCallback(
    (propertyId: string) => `${propertyId}::places-sections`,
    []
  );
  const getGuestEmergencyKey = useCallback(
    (propertyId: string) => `${propertyId}::guest-emergency`,
    []
  );
  const getGuestSafetyKey = useCallback(
    (propertyId: string) => `${propertyId}::guest-safety`,
    []
  );

  /** Icon and colour per guest emergency contact category (Places-style tags). */
  const guestEmergencyCategoryMeta: Record<
    string,
    { icon: string; color: string }
  > = useMemo(
    () => ({
      "Emergency Services": {
        icon: "solid:phone-volume",
        color: "#dd6767"
      },
      "Medical Centres": {
        icon: "solid:house-medical",
        color: "#5d8aeb"
      },
      Pharmacies: {
        icon: "solid:prescription-bottle-medical",
        color: "#43a165"
      }
    }),
    []
  );
  const guestSafetyAdviceTagStyle = useMemo(
    () => ({ icon: "solid:shield-halved", color: "#ca8a04" }),
    []
  );

  useEffect(() => {
    setActiveSectionIndexByKey((prev) => {
      const next = { ...prev };
      properties.forEach((property) => {
        const pages = property.pages ?? [];
        pages.forEach((_page, pageIndex) => {
          const key = getSectionKey(property.id, pageIndex);
          if (next[key] === undefined) {
            next[key] = 0;
          }
        });
      });
      return next;
    });
  }, [getSectionKey, properties]);

  useEffect(() => {
    setActiveExperienceIndexByKey((prev) => {
      const next = { ...prev };
      properties.forEach((property) => {
        const placesKey = getExperienceKey(property.id, "places");
        if (next[placesKey] === undefined) {
          next[placesKey] = 0;
        }
      });
      return next;
    });
  }, [getExperienceKey, properties]);

  useEffect(() => {
    setActivePlacesSectionIndexByKey((prev) => {
      const next = { ...prev };
      properties.forEach((property) => {
        const placesKey = getPlacesSectionKey(property.id);
        if (next[placesKey] === undefined) {
          next[placesKey] = 0;
        }
      });
      return next;
    });
  }, [getPlacesSectionKey, properties]);

  const updateDraft = (propertyId: string, updater: (draft: PropertyDraft) => PropertyDraft) => {
    setDrafts((prev) => {
      const current = prev[propertyId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [propertyId]: updater(current)
      };
    });
  };

  const getImageFilename = (src: string) => {
    if (!src) {
      return "";
    }
    const normalized = src.split("?")[0];
    const parts = normalized.split("/");
    return parts[parts.length - 1] ?? src;
  };

  const parseDateValue = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.includes("/")) {
      const [day, month, year] = trimmed.split("/").map((part) => Number(part));
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }
    if (trimmed.includes("-")) {
      const [year, month, day] = trimmed.split("-").map((part) => Number(part));
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  };

  const formatDateValue = (date: Date | null) => {
    if (!date) {
      return "";
    }
    const day = `${date.getUTCDate()}`.padStart(2, "0");
    const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const addDays = (date: Date, days: number) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

  const calculateNights = (from: string | null | undefined, to: string | null | undefined) => {
    const fromDate = parseDateValue(from);
    const toDate = parseDateValue(to);
    if (!fromDate || !toDate) {
      return null;
    }
    const start = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
    const end = Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate());
    const diff = Math.round((end - start) / 86_400_000);
    return diff > 0 ? diff : null;
  };

  const isSameDay = (left: Date | null, right: Date | null) => {
    if (!left || !right) {
      return false;
    }
    return (
      left.getUTCFullYear() === right.getUTCFullYear() &&
      left.getUTCMonth() === right.getUTCMonth() &&
      left.getUTCDate() === right.getUTCDate()
    );
  };

  const getNextAadeDate = (to: string | null | undefined) => {
    const toDate = parseDateValue(to);
    if (!toDate) {
      return "";
    }
    const nextMonth = toDate.getUTCMonth() + 1;
    const nextYear = nextMonth > 11 ? toDate.getUTCFullYear() + 1 : toDate.getUTCFullYear();
    const monthIndex = nextMonth % 12;
    return formatDateValue(new Date(Date.UTC(nextYear, monthIndex, 20)));
  };

  const toNumber = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    const normalized = value.replace(/[^0-9.-]/g, "");
    if (!normalized) {
      return null;
    }
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatMoney = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) {
      return "";
    }
    return value.toFixed(2);
  };

  const getEurGbpRate = (_date: Date | null) => 0.86;

  const defaultRental = (): RentalDto => ({
    availability: [],
    bookings: [],
    rates: [],
    conditions: []
  });

  const updateFirstRentalUnit = (
    current: PropertyDraft,
    updater: (unit: RentalDto) => RentalDto
  ): PropertyDraft => {
    const units = getRentalUnits(current);
    const next = units.length ? [...units] : [defaultRental()];
    next[0] = updater(next[0]);
    return { ...current, rentalUnits: next };
  };

  const updateRentalUnit = (
    propertyId: string,
    unitIndex: number,
    updater: (unit: RentalDto) => RentalDto
  ) =>
    updateDraft(propertyId, (current) => {
      const units = getRentalUnits(current);
      const next = units.length ? [...units] : [defaultRental()];
      if (unitIndex < 0 || unitIndex >= next.length) {
        return current;
      }
      next[unitIndex] = updater(next[unitIndex]);
      return { ...current, rentalUnits: next };
    });

  const updateBooking = (
    propertyId: string,
    bookingIndex: number,
    updates: Partial<RentalBookingDto>
  ) =>
    updateDraft(propertyId, (current) =>
      updateFirstRentalUnit(current, (unit) => {
        const bookings = unit.bookings ?? [];
        return {
          ...unit,
          bookings: bookings.map((item, itemIndex) =>
            itemIndex === bookingIndex ? { ...item, ...updates } : item
          )
        };
      })
    );

  const renderTabContent = (property: PropertyDto, draft: PropertyDraft, activeTab: string) => {
    const listingOptions = getListingLanguageOptions(draft.listingLanguages);
    if (activeTab === "overview") {
      const selectedCodes = draft.listingLanguages?.length
        ? draft.listingLanguages
        : defaultListingLanguageCodes;
      const toggleListingLanguage = (code: string) => {
        const next = selectedCodes.includes(code)
          ? selectedCodes.filter((c) => c !== code)
          : [...selectedCodes, code];
        if (next.length === 0) return;
        updateDraft(property.id, (current) => ({ ...current, listingLanguages: next }));
      };
      return (
        <div className="admin-tab-page">
          <div className="admin-tab-page-header">
            <h2>{t("admin.property.overview")}</h2>
          </div>
          <div className="admin-form">
            <LocalizedTextField
              label={t("admin.fields.name")}
              value={draft.name}
              languageOptions={listingOptions}
              onChange={(nextValue) =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  name: nextValue
                }))
              }
            />
            <label className="admin-field">
              <span>{t("admin.fields.identifier")}</span>
              <input value={property.id} disabled />
            </label>
            <div className="admin-field">
              <span>{t("admin.fields.listingType")}</span>
              <AdminSelect
                value={draft.status}
                options={listingTypeOptions}
                onChange={(nextValue) =>
                  updateDraft(property.id, (current) => ({
                    ...current,
                    status: nextValue
                  }))
                }
              />
            </div>
            <LocalizedTextField
              label={t("admin.fields.summary")}
              value={draft.summary}
              multiline
              rows={10}
              languageOptions={listingOptions}
              onChange={(nextValue) =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  summary: nextValue
                }))
              }
            />
          </div>
          <div className="admin-form">
            <div className="admin-field">
              <h2>{t("admin.fields.listingLanguages")}</h2>
              <p className="help">{t("admin.fields.listingLanguagesHelp")}</p>
              <div className="listing-languages-grid" role="group" aria-label={t("admin.fields.listingLanguages")}>
                {supportedLanguages.map((option) => (
                  <div key={option.code} className="custom-checkbox">
                    <input
                      type="checkbox"
                      id={option.code}
                      checked={selectedCodes.includes(option.code)}
                      onChange={() => toggleListingLanguage(option.code)}
                    />
                    <label htmlFor={option.code} className={ `flag-${option.code}` }></label>
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "hero") {
      const heroImages = draft.heroImages ?? [];
      return (
        <div className="admin-tab-page">
          <div className="admin-tab-page-header">
            <h2>{t("admin.hero.title")}</h2>
          </div>
          <div className="admin-field">
            <span>{t("admin.hero.transition")}</span>
            <AdminSelect
              value={draft.heroSettings?.transition ?? ""}
              options={[
                { value: "", label: t("admin.hero.transition.none") },
                { value: "fade", label: t("admin.hero.transition.fade") },
                { value: "slide", label: t("admin.hero.transition.slide") },
                { value: "zoom", label: t("admin.hero.transition.zoom") },
                { value: "lift", label: t("admin.hero.transition.lift") },
                { value: "pan", label: t("admin.hero.transition.pan") }
              ]}
              onChange={(nextValue) => {
                const nextTransition = nextValue as HeroTransition;
                updateDraft(property.id, (current) => ({
                  ...current,
                  heroSettings: {
                    transition: nextTransition || undefined
                  }
                }));
              }}
            />
          </div>
          <div className="admin-list">
            <div className="admin-list-header">
              <h3>{t("admin.hero.images")}</h3>
              <button
                type="button"
                className="admin-secondary"
                onClick={() =>
                  updateDraft(property.id, (current) => ({
                    ...current,
                    heroImages: [
                      ...(current.heroImages ?? []),
                      { src: "", alt: "" }
                    ]
                  }))
                }
              >
                <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addImage")}</span>
              </button>
            </div>
            {heroImages.length === 0 ? (
              <p className="muted">{t("admin.hero.none")}</p>
            ) : (
              <div className="admin-image-grid">
                {heroImages.map((image, index) => (
                  <div key={index} className="admin-image-tile">
                    <div className="admin-image-thumb">
                      {image.src ? (
                        <img
                          src={resolveImageUrl(property.id, image.src)}
                          alt={resolveLocalizedText(image.alt ?? getImageFilename(image.src), language)}
                        />
                      ) : (
                        <span className="admin-image-placeholder">{t("admin.images.none")}</span>
                      )}
                    </div>
                    <input
                      className="admin-image-input"
                      value={image.src}
                      placeholder={t("admin.images.path")}
                      onChange={(event) =>
                        updateDraft(property.id, (current) => ({
                          ...current,
                          heroImages: (current.heroImages ?? []).map((item, itemIndex) =>
                            itemIndex === index ? { ...item, src: event.target.value } : item
                          )
                        }))
                      }
                    />
                    <LocalizedTextField
                      languageOptions={listingOptions}
                      className="admin-image-caption"
                      label={t("admin.images.caption")}
                      value={image.alt}
                      placeholder={t("admin.images.caption")}
                      onChange={(nextValue) =>
                        updateDraft(property.id, (current) => ({
                          ...current,
                          heroImages: (current.heroImages ?? []).map((item, itemIndex) =>
                            itemIndex === index ? { ...item, alt: nextValue } : item
                          )
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="admin-image-remove"
                      aria-label={t("admin.actions.removeImage")}
                      onClick={() =>
                        updateDraft(property.id, (current) => ({
                          ...current,
                          heroImages: (current.heroImages ?? []).filter(
                            (_item, itemIndex) => itemIndex !== index
                          )
                        }))
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "pages") {
      const pages = draft.pages ?? [];
      const activePageIndex = Math.min(
        Math.max(activePageIndexById[property.id] ?? 0, 0),
        Math.max(pages.length - 1, 0)
      );
      const activePage = pages[activePageIndex];
      return (
        <div className="admin-tab-page">
          <div className="admin-tab-page-header">
            <h2>{t("admin.pages.title")}</h2>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => {
                updateDraft(property.id, (current) => ({
                  ...current,
                  pages: [
                    ...(current.pages ?? []),
                    { id: "new-page", title: t("admin.pages.newPage"), sections: [] }
                  ]
                }));
                setActivePageIndexById((prev) => ({
                  ...prev,
                  [property.id]: pages.length
                }));
              }}
            >
              <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addPage")}</span>
            </button>
          </div>
          {pages.length > 0 ? (
            <div className="admin-tabs">
              {pages.map((page, pageIndex) => (
                <button
                  key={`${page.id}-${pageIndex}`}
                  type="button"
                  className={`admin-tab${pageIndex === activePageIndex ? " active" : ""}`}
                  onClick={() =>
                    setActivePageIndexById((prev) => ({
                      ...prev,
                      [property.id]: pageIndex
                    }))
                  }
                >
                  {resolveLocalizedText(page.title ?? "", language) || `Page ${pageIndex + 1}`}
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">{t("admin.pages.none")}</p>
          )}
          {!activePage ? null : (
            <div key={`${activePage.id}-${activePageIndex}`} className="admin-nested-card">
              <div className="admin-list-header">
                <h4>
                  {resolveLocalizedText(activePage.title, language)} <span>({t("admin.pages.page")} {activePageIndex + 1})</span>
                </h4>
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() => {
                    updateDraft(property.id, (current) => ({
                      ...current,
                      pages: (current.pages ?? []).filter(
                        (_item, itemIndex) => itemIndex !== activePageIndex
                      )
                    }));
                    setActivePageIndexById((prev) => ({
                      ...prev,
                      [property.id]: Math.max(activePageIndex - 1, 0)
                    }));
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removePage")}</span>
                </button>
              </div>
              <div className="admin-form">
                <label className="admin-field">
                  <span>{t("admin.fields.pageId")}</span>
                  <input
                    value={activePage.id}
                    onChange={(event) =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pages: (current.pages ?? []).map((item, itemIndex) =>
                          itemIndex === activePageIndex ? { ...item, id: event.target.value } : item
                        )
                      }))
                    }
                  />
                </label>
                <LocalizedTextField
                  languageOptions={listingOptions}
                  label={t("admin.fields.title")}
                  value={activePage.title}
                  onChange={(nextValue) =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      pages: (current.pages ?? []).map((item, itemIndex) =>
                        itemIndex === activePageIndex
                          ? { ...item, title: nextValue }
                          : item
                      )
                    }))
                  }
                />
                <LocalizedRichTextField
                  languageOptions={listingOptions}
                  label={t("admin.fields.heroText")}
                  value={activePage.heroText ?? ""}
                  rows={4}
                  onChange={(nextValue) =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      pages: (current.pages ?? []).map((item, itemIndex) =>
                        itemIndex === activePageIndex ? { ...item, heroText: nextValue } : item
                      )
                    }))
                  }
                />
              </div>

              <div className="admin-list">
                <div className="admin-list-header">
                  <h4>{t("admin.pages.heroImages")}</h4>
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pages: (current.pages ?? []).map((item, itemIndex) =>
                          itemIndex === activePageIndex
                            ? {
                                ...item,
                                heroImages: [
                                  ...(item.heroImages ?? []),
                                  { src: "", alt: "" }
                                ]
                              }
                            : item
                        )
                      }))
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addImage")}</span>
                  </button>
                </div>
                {(activePage.heroImages ?? []).length === 0 ? (
                  <p className="muted">{t("admin.hero.none")}</p>
                ) : (
                  <div className="admin-image-grid">
                    {(activePage.heroImages ?? []).map((image, imageIndex) => (
                      <div key={imageIndex} className="admin-image-tile">
                        <div className="admin-image-thumb">
                          {image.src ? (
                            <img
                              src={resolveImageUrl(property.id, image.src)}
                              alt={resolveLocalizedText(image.alt ?? getImageFilename(image.src), language)}
                            />
                          ) : (
                            <span className="admin-image-placeholder">{t("admin.images.none")}</span>
                          )}
                        </div>
                        <input
                          className="admin-image-input"
                          value={image.src}
                          placeholder={t("admin.images.path")}
                          onChange={(event) =>
                            updateDraft(property.id, (current) => ({
                              ...current,
                              pages: (current.pages ?? []).map((item, itemIndex) =>
                                itemIndex === activePageIndex
                                  ? {
                                      ...item,
                                      heroImages: (item.heroImages ?? []).map((img, imgIndex) =>
                                        imgIndex === imageIndex
                                          ? { ...img, src: event.target.value }
                                          : img
                                      )
                                    }
                                  : item
                              )
                            }))
                          }
                        />
                        <LocalizedTextField
                          languageOptions={listingOptions}
                          className="admin-image-caption"
                          label={t("admin.images.caption")}
                          value={image.alt}
                          placeholder={t("admin.images.caption")}
                          onChange={(nextValue) =>
                            updateDraft(property.id, (current) => ({
                              ...current,
                              pages: (current.pages ?? []).map((item, itemIndex) =>
                                itemIndex === activePageIndex
                                  ? {
                                      ...item,
                                      heroImages: (item.heroImages ?? []).map((img, imgIndex) =>
                                        imgIndex === imageIndex
                                          ? { ...img, alt: nextValue }
                                          : img
                                      )
                                    }
                                  : item
                              )
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="admin-image-remove"
                          aria-label={t("admin.actions.removeImage")}
                          onClick={() =>
                            updateDraft(property.id, (current) => ({
                              ...current,
                              pages: (current.pages ?? []).map((item, itemIndex) =>
                                itemIndex === activePageIndex
                                  ? {
                                      ...item,
                                      heroImages: (item.heroImages ?? []).filter(
                                        (_img, imgIndex) => imgIndex !== imageIndex
                                      )
                                    }
                                  : item
                              )
                            }))
                          }
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-list">
                <div className="admin-list-header">
                  <h4>{t("admin.sections.title")}</h4>
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() => {
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pages: (current.pages ?? []).map((item, itemIndex) =>
                          itemIndex === activePageIndex
                            ? {
                                ...item,
                                sections: [
                                  ...item.sections,
                                  {
                                    id: "new-section",
                                    title: "New Section",
                                    heroText: "",
                                    heroImages: [],
                                    images: []
                                  }
                                ]
                              }
                            : item
                        )
                      }));
                      setActiveSectionIndexByKey((prev) => ({
                        ...prev,
                        [getSectionKey(property.id, activePageIndex)]:
                          (activePage.sections ?? []).length
                      }));
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addSection")}</span>
                  </button>
                </div>
                <label className="admin-inline-input admin-checkbox">
                  <span>{t("admin.pages.submenuHint")}</span>
                  <input
                    type="checkbox"
                    checked={(activePage.showSectionsSubmenu ?? "").toLowerCase() === "yes"}
                    onChange={(event) =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pages: (current.pages ?? []).map((item, itemIndex) =>
                          itemIndex === activePageIndex
                            ? {
                                ...item,
                                showSectionsSubmenu: event.target.checked ? "Yes" : "No"
                              }
                            : item
                        )
                      }))
                    }
                  />
                </label>
                {(() => {
                  const sections = activePage.sections ?? [];
                  const sectionKey = getSectionKey(property.id, activePageIndex);
                  const activeSectionIndex = Math.min(
                    Math.max(activeSectionIndexByKey[sectionKey] ?? 0, 0),
                    Math.max(sections.length - 1, 0)
                  );
                  const activeSection = sections[activeSectionIndex];
                  return (
                    <>
                      {sections.length > 0 ? (
                        <div className="admin-section-tabs">
                          {sections.map((section, sectionIndex) => (
                            <button
                              key={`${section.id}-${sectionIndex}`}
                              type="button"
                              className={`admin-section-tab${
                                sectionIndex === activeSectionIndex ? " active" : ""
                              }`}
                              onClick={() =>
                                setActiveSectionIndexByKey((prev) => ({
                                  ...prev,
                                  [sectionKey]: sectionIndex
                                }))
                              }
                            >
                              {resolveLocalizedText(section.title ?? "", language) || `Section ${sectionIndex + 1}`}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="muted">{t("admin.sections.none")}</p>
                      )}
                      {!activeSection ? null : (
                        <div
                          key={`${activeSection.id}-${activeSectionIndex}`}
                          className="admin-nested-card"
                        >
                          <div className="admin-list-header">
                            <h5>
                              {resolveLocalizedText(activeSection.title ?? "", language)} <span>({t("admin.sections.section")} {activeSectionIndex + 1})</span>
                            </h5>
                            <button
                              type="button"
                              className="admin-danger"
                              onClick={() => {
                                updateDraft(property.id, (current) => ({
                                  ...current,
                                  pages: (current.pages ?? []).map((item, itemIndex) =>
                                    itemIndex === activePageIndex
                                      ? {
                                          ...item,
                                          sections: item.sections.filter(
                                            (_section, idx) => idx !== activeSectionIndex
                                          )
                                        }
                                      : item
                                  )
                                }));
                                setActiveSectionIndexByKey((prev) => ({
                                  ...prev,
                                  [sectionKey]: Math.max(activeSectionIndex - 1, 0)
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removeSection")}</span>
                            </button>
                          </div>
                          <div className="admin-form">
                            <label className="admin-field">
                              <span>{t("admin.fields.sectionId")}</span>
                              <input
                                value={activeSection.id}
                                onChange={(event) =>
                                  updateDraft(property.id, (current) => ({
                                    ...current,
                                    pages: (current.pages ?? []).map((item, itemIndex) =>
                                      itemIndex === activePageIndex
                                        ? {
                                            ...item,
                                            sections: item.sections.map((itemSection, idx) =>
                                              idx === activeSectionIndex
                                                ? { ...itemSection, id: event.target.value }
                                                : itemSection
                                            )
                                          }
                                        : item
                                    )
                                  }))
                                }
                              />
                            </label>
                            <LocalizedTextField
                              languageOptions={listingOptions}
                              label={t("admin.fields.title")}
                              value={activeSection.title ?? ""}
                              onChange={(nextValue) =>
                                updateDraft(property.id, (current) => ({
                                  ...current,
                                  pages: (current.pages ?? []).map((item, itemIndex) =>
                                    itemIndex === activePageIndex
                                      ? {
                                          ...item,
                                          sections: item.sections.map((itemSection, idx) =>
                                            idx === activeSectionIndex
                                              ? {
                                                  ...itemSection,
                                                  title: nextValue
                                                }
                                              : itemSection
                                          )
                                        }
                                      : item
                                  )
                                }))
                              }
                            />
                          <div className="admin-list">
                            <div className="admin-list-header">
                              <p>{t("admin.sections.heroImages")}</p>
                              <button
                                type="button"
                                className="admin-secondary"
                                onClick={() =>
                                  updateDraft(property.id, (current) => ({
                                    ...current,
                                    pages: (current.pages ?? []).map((item, itemIndex) =>
                                      itemIndex === activePageIndex
                                        ? {
                                            ...item,
                                            sections: item.sections.map((itemSection, idx) =>
                                              idx === activeSectionIndex
                                                ? {
                                                    ...itemSection,
                                                    heroImages: [
                                                      ...(itemSection.heroImages ?? []),
                                                      { src: "", alt: "" }
                                                    ]
                                                  }
                                                : itemSection
                                            )
                                          }
                                        : item
                                    )
                                  }))
                                }
                              >
                                <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addImage")}</span>
                              </button>
                            </div>
                            <div className="admin-list-group">
                            <p className="help">{t("admin.sections.heroImages.help")}</p>
                            {(activeSection.heroImages ?? []).length === 0 ? (
                              <p className="muted">{t("admin.hero.none")}</p>
                            ) : (
                              <div className="admin-image-grid">
                                {(activeSection.heroImages ?? []).map((image, imageIndex) => (
                                  <div
                                    key={imageIndex}
                                    className="admin-image-tile"
                                  >
                                    <div className="admin-image-thumb">
                                      {image.src ? (
                                        <img
                                          src={resolveImageUrl(property.id, image.src)}
                                          alt={resolveLocalizedText(image.alt ?? getImageFilename(image.src), language)}
                                        />
                                      ) : (
                                        <span className="admin-image-placeholder">{t("admin.images.none")}</span>
                                      )}
                                    </div>
                                    <input
                                      className="admin-image-input"
                                      value={image.src}
                                      placeholder={t("admin.images.path")}
                                      onChange={(event) =>
                                        updateDraft(property.id, (current) => ({
                                          ...current,
                                          pages: (current.pages ?? []).map((item, itemIndex) =>
                                            itemIndex === activePageIndex
                                              ? {
                                                  ...item,
                                                  sections: item.sections.map((itemSection, idx) =>
                                                    idx === activeSectionIndex
                                                      ? {
                                                          ...itemSection,
                                                          heroImages: (
                                                            itemSection.heroImages ?? []
                                                          ).map((img, imgIndex) =>
                                                            imgIndex === imageIndex
                                                              ? { ...img, src: event.target.value }
                                                              : img
                                                          )
                                                        }
                                                      : itemSection
                                                  )
                                                }
                                              : item
                                          )
                                        }))
                                      }
                                    />
                                    <LocalizedTextField
                                      languageOptions={listingOptions}
                                      className="admin-image-caption"
                                      label={t("admin.images.caption")}
                                      value={image.alt}
                                      placeholder={t("admin.images.caption")}
                                      onChange={(nextValue) =>
                                        updateDraft(property.id, (current) => ({
                                          ...current,
                                          pages: (current.pages ?? []).map((item, itemIndex) =>
                                            itemIndex === activePageIndex
                                              ? {
                                                  ...item,
                                                  sections: item.sections.map((itemSection, idx) =>
                                                    idx === activeSectionIndex
                                                      ? {
                                                          ...itemSection,
                                                          heroImages: (
                                                            itemSection.heroImages ?? []
                                                          ).map((img, imgIndex) =>
                                                            imgIndex === imageIndex
                                                              ? { ...img, alt: nextValue }
                                                              : img
                                                          )
                                                        }
                                                      : itemSection
                                                  )
                                                }
                                              : item
                                          )
                                        }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="admin-image-remove"
                                      aria-label={t("admin.actions.removeImage")}
                                      onClick={() =>
                                        updateDraft(property.id, (current) => ({
                                          ...current,
                                          pages: (current.pages ?? []).map((item, itemIndex) =>
                                            itemIndex === activePageIndex
                                              ? {
                                                  ...item,
                                                  sections: item.sections.map((itemSection, idx) =>
                                                    idx === activeSectionIndex
                                                      ? {
                                                          ...itemSection,
                                                          heroImages: (
                                                            itemSection.heroImages ?? []
                                                          ).filter(
                                                            (_img, imgIndex) =>
                                                              imgIndex !== imageIndex
                                                          )
                                                        }
                                                      : itemSection
                                                  )
                                                }
                                              : item
                                          )
                                        }))
                                      }
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            </div>
                          </div>
                            <LocalizedRichTextField
                              languageOptions={listingOptions}
                              label={t("admin.fields.heroText")}
                              value={activeSection.heroText ?? ""}
                              rows={2}
                              onChange={(nextValue) =>
                                updateDraft(property.id, (current) => ({
                                  ...current,
                                  pages: (current.pages ?? []).map((item, itemIndex) =>
                                    itemIndex === activePageIndex
                                      ? {
                                          ...item,
                                          sections: item.sections.map((itemSection, idx) =>
                                            idx === activeSectionIndex
                                              ? {
                                                  ...itemSection,
                                                  heroText: nextValue
                                                }
                                              : itemSection
                                          )
                                        }
                                      : item
                                  )
                                }))
                              }
                            />
                            <LocalizedRichTextField
                              languageOptions={listingOptions}
                              label={t("admin.fields.description")}
                              value={activeSection.description ?? ""}
                              rows={6}
                              onChange={(nextValue) =>
                                updateDraft(property.id, (current) => ({
                                  ...current,
                                  pages: (current.pages ?? []).map((item, itemIndex) =>
                                    itemIndex === activePageIndex
                                      ? {
                                          ...item,
                                          sections: item.sections.map((itemSection, idx) =>
                                            idx === activeSectionIndex
                                              ? {
                                                  ...itemSection,
                                                  description: nextValue
                                                }
                                              : itemSection
                                          )
                                        }
                                      : item
                                  )
                                }))
                              }
                            />
                          </div>
                          <div className="admin-list">
                            <div className="admin-list-header">
                              <h5>{t("admin.sections.gallery")}</h5>
                              <button
                                type="button"
                                className="admin-secondary"
                                onClick={() =>
                                  updateDraft(property.id, (current) => ({
                                    ...current,
                                    pages: (current.pages ?? []).map((item, itemIndex) =>
                                      itemIndex === activePageIndex
                                        ? {
                                            ...item,
                                            sections: item.sections.map((itemSection, idx) =>
                                              idx === activeSectionIndex
                                                ? {
                                                    ...itemSection,
                                                    images: [
                                                      ...itemSection.images,
                                                      { src: "", alt: "" }
                                                    ]
                                                  }
                                                : itemSection
                                            )
                                          }
                                        : item
                                    )
                                  }))
                                }
                              >
                                <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addImage")}</span>
                              </button>
                            </div>
                            <p className="help">{t("admin.sections.galleryHelp")}</p>
                            {activeSection.images.length === 0 ? (
                              <p className="muted">{t("admin.images.noneGallery")}</p>
                            ) : (
                              <div className="admin-image-grid">
                                {activeSection.images.map((image, imageIndex) => (
                                  <div
                                    key={imageIndex}
                                    className="admin-image-tile"
                                  >
                                    <button
                                      type="button"
                                      className="admin-image-remove"
                                      aria-label={t("admin.actions.removeImage")}
                                      onClick={() =>
                                        updateDraft(property.id, (current) => ({
                                          ...current,
                                          pages: (current.pages ?? []).map((item, itemIndex) =>
                                            itemIndex === activePageIndex
                                              ? {
                                                  ...item,
                                                  sections: item.sections.map((itemSection, idx) =>
                                                    idx === activeSectionIndex
                                                      ? {
                                                          ...itemSection,
                                                          images: itemSection.images.filter(
                                                            (_img, imgIndex) =>
                                                              imgIndex !== imageIndex
                                                          )
                                                        }
                                                      : itemSection
                                                  )
                                                }
                                              : item
                                          )
                                        }))
                                      }
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <div className="admin-image-thumb">
                                      {image.src ? (
                                        <img
                                          src={resolveImageUrl(property.id, image.src)}
                                          alt={resolveLocalizedText(image.alt ?? getImageFilename(image.src), language)}
                                        />
                                      ) : (
                                        <span className="admin-image-placeholder">{t("admin.images.none")}</span>
                                      )}
                                    </div>
                                    <input
                                      className="admin-image-input"
                                      value={image.src}
                                      placeholder={t("admin.images.path")}
                                      onChange={(event) =>
                                        updateDraft(property.id, (current) => ({
                                          ...current,
                                          pages: (current.pages ?? []).map((item, itemIndex) =>
                                            itemIndex === activePageIndex
                                              ? {
                                                  ...item,
                                                  sections: item.sections.map((itemSection, idx) =>
                                                    idx === activeSectionIndex
                                                      ? {
                                                          ...itemSection,
                                                          images: itemSection.images.map(
                                                            (img, imgIndex) =>
                                                              imgIndex === imageIndex
                                                                ? {
                                                                    ...img,
                                                                    src: event.target.value
                                                                  }
                                                                : img
                                                          )
                                                        }
                                                      : itemSection
                                                  )
                                                }
                                              : item
                                          )
                                        }))
                                      }
                                    />
                                    <LocalizedTextField
                                      languageOptions={listingOptions}
                                      className="admin-image-caption"
                                      label={t("admin.images.caption")}
                                      value={image.alt}
                                      placeholder={t("admin.images.caption")}
                                      onChange={(nextValue) =>
                                        updateDraft(property.id, (current) => ({
                                          ...current,
                                          pages: (current.pages ?? []).map((item, itemIndex) =>
                                            itemIndex === activePageIndex
                                              ? {
                                                  ...item,
                                                  sections: item.sections.map((itemSection, idx) =>
                                                    idx === activeSectionIndex
                                                      ? {
                                                          ...itemSection,
                                                          images: itemSection.images.map(
                                                            (img, imgIndex) =>
                                                              imgIndex === imageIndex
                                                                ? {
                                                                    ...img,
                                                                    alt: nextValue
                                                                  }
                                                                : img
                                                          )
                                                        }
                                                      : itemSection
                                                  )
                                                }
                                              : item
                                          )
                                        }))
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "places") {
      const places = draft.places ?? { pageTitle: "", description: "", sections: [], items: [] };
      const updatePlaces = (updater: (page: typeof places) => typeof places) =>
        updateDraft(property.id, (current) => {
          const page = current.places ?? { pageTitle: "", description: "", sections: [], items: [] };
          return {
            ...current,
            places: updater({
              pageTitle: page.pageTitle ?? "",
              description: page.description ?? "",
              sections: page.sections ?? [],
              items: page.items ?? []
            })
          };
        });
      const newExperienceItem = () => ({
        category: "",
        heading: "",
        heroImages: [],
        itemText: "",
        galleryImages: [],
        distance: null,
        mapReference: "",
        links: []
      });
      const newPlacesSection = () => ({
        id: createPlacesSectionId(),
        title: "",
        description: "",
        icon: "",
        color: "",
        categoryValue: ""
      });
      const renderExperienceItems = (
        items: typeof places.items,
        onChange: (nextItems: typeof places.items) => void,
        includeCategory: boolean,
        experienceKey: string,
        categoryOptions?: Array<{ value: string; label: string }>,
        categoryMetaByValue?: Record<string, { icon?: string; color?: string }>
      ) => {
        const getReadableTextColor = (value?: string) => {
          const raw = value?.trim() ?? "";
          if (!raw.startsWith("#")) {
            return undefined;
          }
          const hex = raw.length === 4
            ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
            : raw;
          if (hex.length !== 7) {
            return undefined;
          }
          const r = Number.parseInt(hex.slice(1, 3), 16);
          const g = Number.parseInt(hex.slice(3, 5), 16);
          const b = Number.parseInt(hex.slice(5, 7), 16);
          if ([r, g, b].some((channel) => Number.isNaN(channel))) {
            return undefined;
          }
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.6 ? "#1f2937" : "#ffffff";
        };
        const activeIndex = Math.min(
          Math.max(activeExperienceIndexByKey[experienceKey] ?? 0, 0),
          Math.max((items ?? []).length - 1, 0)
        );
        return (
          <div className="admin-list">
            <div className="admin-list-header">
              <h4>{t("admin.experiences.items")}</h4>
              <button
                type="button"
                className="admin-secondary"
                onClick={() => {
                  const nextItems = [...(items ?? []), newExperienceItem()];
                  onChange(nextItems);
                  setActiveExperienceIndexByKey((prev) => ({
                    ...prev,
                    [experienceKey]: nextItems.length - 1
                  }));
                }}
              >
                <FontAwesomeIcon icon={faPlus} /><span>{t("admin.experiences.addItem")}</span>
              </button>
            </div>
            {(items ?? []).length === 0 ? (
              <p className="muted">{t("admin.experiences.none")}</p>
            ) : (
              <>
                <div className="admin-tabs">
                  {(items ?? []).map((item, itemIndex) => (
                    <button
                      key={`experience-tab-${itemIndex}`}
                      type="button"
                      className={`admin-tab${itemIndex === activeIndex ? " active" : ""}`}
                      style={{
                        ...(categoryMetaByValue?.[
                          typeof item.category === "string"
                            ? item.category
                            : resolveLocalizedText(item.category ?? "", language)
                        ]?.color
                          ? {
                              backgroundColor:
                                categoryMetaByValue?.[
                                  typeof item.category === "string"
                                    ? item.category
                                    : resolveLocalizedText(item.category ?? "", language)
                                ]?.color,
                              borderColor:
                                categoryMetaByValue?.[
                                  typeof item.category === "string"
                                    ? item.category
                                    : resolveLocalizedText(item.category ?? "", language)
                                ]?.color,
                              color: getReadableTextColor(
                                categoryMetaByValue?.[
                                  typeof item.category === "string"
                                    ? item.category
                                    : resolveLocalizedText(item.category ?? "", language)
                                ]?.color
                              )
                            }
                          : {})
                      }}
                      onClick={() =>
                        setActiveExperienceIndexByKey((prev) => ({
                          ...prev,
                          [experienceKey]: itemIndex
                        }))
                      }
                    >
                      {categoryMetaByValue?.[
                        typeof item.category === "string"
                          ? item.category
                          : resolveLocalizedText(item.category ?? "", language)
                      ]?.icon ? (
                        <span className="admin-tab-icon">
                          <i
                            className={getIconClassName(
                              categoryMetaByValue[
                                typeof item.category === "string"
                                  ? item.category
                                  : resolveLocalizedText(item.category ?? "", language)
                              ]?.icon
                            )}
                          />
                        </span>
                      ) : null}
                      {resolveLocalizedText(item.heading ?? "", language)
                        || t("admin.experiences.itemLabel").replace("{index}", String(itemIndex + 1))}
                    </button>
                  ))}
                </div>
                {(items ?? []).map((item, itemIndex) =>
                  itemIndex === activeIndex ? (
                    <div key={`experience-${itemIndex}`} className="admin-nested-card">
                      <div className="admin-list-header">
                        <h4>
                          {resolveLocalizedText(item.heading ?? "", language)
                            || t("admin.experiences.itemLabel").replace("{index}", String(itemIndex + 1))}
                        </h4>
                        <button
                          type="button"
                          className="admin-danger"
                          onClick={() => {
                            const nextItems = (items ?? []).filter((_value, index) => index !== itemIndex);
                            onChange(nextItems);
                            setActiveExperienceIndexByKey((prev) => ({
                              ...prev,
                              [experienceKey]: Math.max(itemIndex - 1, 0)
                            }));
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} /><span>{t("admin.experiences.removeItem")}</span>
                        </button>
                      </div>

                      <div className="admin-form">
                        {includeCategory ? (
                          <label className="admin-field">
                            <span>{t("admin.experiences.category")}</span>
                            <AdminSelect
                              value={
                                typeof item.category === "string"
                                  ? item.category
                                  : resolveLocalizedText(item.category ?? "", language)
                              }
                              options={[
                                { value: "", label: t("admin.places.categoryUnassigned") },
                                ...(categoryOptions ?? [])
                              ]}
                              onChange={(value) =>
                                onChange((items ?? []).map((entry, index) =>
                                  index === itemIndex ? { ...entry, category: value } : entry
                                ))
                              }
                            />
                          </label>
                        ) : null}
                        <LocalizedTextField
                          languageOptions={listingOptions}
                          label={t("admin.experiences.heading")}
                          value={item.heading ?? ""}
                          onChange={(nextValue) =>
                            onChange((items ?? []).map((entry, index) =>
                              index === itemIndex ? { ...entry, heading: nextValue } : entry
                            ))
                          }
                        />

                        <label className="admin-field">
                          <span>{t("admin.experiences.distance")}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min="0"
                            value={item.distance ?? ""}
                            placeholder={t("admin.experiences.distancePlaceholder")}
                            onChange={(event) => {
                              const raw = event.target.value;
                              const nextValue = raw.trim().length === 0 ? null : Number(raw);
                              onChange((items ?? []).map((entry, index) =>
                                index === itemIndex
                                  ? { ...entry, distance: Number.isNaN(nextValue) ? null : nextValue }
                                  : entry
                              ));
                            }}
                          />
                        </label>

                        <label className="admin-field">
                          <span>{t("admin.experiences.mapReference")}</span>
                          <input
                            value={item.mapReference ?? ""}
                            placeholder={t("admin.experiences.mapPlaceholder")}
                            onChange={(event) =>
                              onChange((items ?? []).map((entry, index) =>
                                index === itemIndex ? { ...entry, mapReference: event.target.value } : entry
                              ))
                            }
                          />
                        </label>

                        <div className="admin-list">
                          <div className="admin-list-header">
                            <h4>{t("admin.experiences.heroImages")}</h4>
                            <button
                              type="button"
                              className="admin-secondary"
                              onClick={() =>
                                onChange((items ?? []).map((entry, index) =>
                                  index === itemIndex
                                    ? {
                                        ...entry,
                                        heroImages: [...(entry.heroImages ?? []), { src: "", alt: "" }]
                                      }
                                    : entry
                                ))
                              }
                            >
                              <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addImage")}</span>
                            </button>
                          </div>
                          {(item.heroImages ?? []).length === 0 ? (
                            <p className="muted">{t("admin.hero.none")}</p>
                          ) : (
                            <div className="admin-image-grid">
                              {(item.heroImages ?? []).map((image, imageIndex) => (
                                <div key={imageIndex} className="admin-image-tile">
                                  <div className="admin-image-thumb">
                                    {image.src ? (
                                      <img
                                        src={resolveImageUrl(property.id, image.src)}
                                        alt={resolveLocalizedText(image.alt ?? getImageFilename(image.src), language)}
                                      />
                                    ) : (
                                      <span className="admin-image-placeholder">{t("admin.images.none")}</span>
                                    )}
                                  </div>
                                  <input
                                    className="admin-image-input"
                                    value={image.src}
                                    placeholder={t("admin.images.path")}
                                    onChange={(event) =>
                                      onChange((items ?? []).map((entry, index) =>
                                        index === itemIndex
                                          ? {
                                              ...entry,
                                              heroImages: (entry.heroImages ?? []).map((img, idx) =>
                                                idx === imageIndex ? { ...img, src: event.target.value } : img
                                              )
                                            }
                                          : entry
                                      ))
                                    }
                                  />
                                  <LocalizedTextField
                                    languageOptions={listingOptions}
                                    className="admin-image-caption"
                                    label={t("admin.images.caption")}
                                    value={image.alt}
                                    placeholder={t("admin.images.caption")}
                                    onChange={(nextValue) =>
                                      onChange((items ?? []).map((entry, index) =>
                                        index === itemIndex
                                          ? {
                                              ...entry,
                                              heroImages: (entry.heroImages ?? []).map((img, idx) =>
                                                idx === imageIndex ? { ...img, alt: nextValue } : img
                                              )
                                            }
                                          : entry
                                      ))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="admin-image-remove"
                                    aria-label={t("admin.actions.removeImage")}
                                    onClick={() =>
                                      onChange((items ?? []).map((entry, index) =>
                                        index === itemIndex
                                          ? {
                                              ...entry,
                                              heroImages: (entry.heroImages ?? []).filter(
                                                (_img, idx) => idx !== imageIndex
                                              )
                                            }
                                          : entry
                                      ))
                                    }
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="admin-list">
                          <LocalizedRichTextField
                            languageOptions={listingOptions}
                            label={t("admin.experiences.itemText")}
                            value={item.itemText ?? ""}
                            rows={6}
                            onChange={(nextValue) =>
                              onChange((items ?? []).map((entry, index) =>
                                index === itemIndex ? { ...entry, itemText: nextValue } : entry
                              ))
                            }
                          />
                        </div>
                      </div>

                      <div className="admin-list">
                        <div className="admin-list-header">
                          <h4>{t("admin.experiences.galleryImages")}</h4>
                          <button
                            type="button"
                            className="admin-secondary"
                            onClick={() =>
                              onChange((items ?? []).map((entry, index) =>
                                index === itemIndex
                                  ? {
                                      ...entry,
                                      galleryImages: [...(entry.galleryImages ?? []), { src: "", alt: "" }]
                                    }
                                  : entry
                              ))
                            }
                          >
                            <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addImage")}</span>
                          </button>
                        </div>
                        {(item.galleryImages ?? []).length === 0 ? (
                          <p className="muted">{t("admin.sections.galleryHelp")}</p>
                        ) : (
                          <div className="admin-image-grid">
                            {(item.galleryImages ?? []).map((image, imageIndex) => (
                              <div key={imageIndex} className="admin-image-tile">
                                <div className="admin-image-thumb">
                                  {image.src ? (
                                    <img
                                      src={resolveImageUrl(property.id, image.src)}
                                      alt={resolveLocalizedText(image.alt ?? getImageFilename(image.src), language)}
                                    />
                                  ) : (
                                    <span className="admin-image-placeholder">{t("admin.images.none")}</span>
                                  )}
                                </div>
                                <input
                                  className="admin-image-input"
                                  value={image.src}
                                  placeholder={t("admin.images.path")}
                                  onChange={(event) =>
                                    onChange((items ?? []).map((entry, index) =>
                                      index === itemIndex
                                        ? {
                                            ...entry,
                                            galleryImages: (entry.galleryImages ?? []).map((img, idx) =>
                                              idx === imageIndex ? { ...img, src: event.target.value } : img
                                            )
                                          }
                                        : entry
                                    ))
                                  }
                                />
                                <LocalizedTextField
                                  languageOptions={listingOptions}
                                  className="admin-image-caption"
                                  label={t("admin.images.caption")}
                                  value={image.alt}
                                  placeholder={t("admin.images.caption")}
                                  onChange={(nextValue) =>
                                    onChange((items ?? []).map((entry, index) =>
                                      index === itemIndex
                                        ? {
                                            ...entry,
                                            galleryImages: (entry.galleryImages ?? []).map((img, idx) =>
                                              idx === imageIndex ? { ...img, alt: nextValue } : img
                                            )
                                          }
                                        : entry
                                    ))
                                  }
                                />
                                <button
                                  type="button"
                                  className="admin-image-remove"
                                  aria-label={t("admin.actions.removeImage")}
                                  onClick={() =>
                                    onChange((items ?? []).map((entry, index) =>
                                      index === itemIndex
                                        ? {
                                            ...entry,
                                            galleryImages: (entry.galleryImages ?? []).filter(
                                              (_img, idx) => idx !== imageIndex
                                            )
                                          }
                                        : entry
                                    ))
                                  }
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="admin-list">
                        <div className="admin-list-header">
                          <h4>{t("admin.experiences.links")}</h4>
                          <button
                            type="button"
                            className="admin-secondary"
                            onClick={() =>
                              onChange((items ?? []).map((entry, index) =>
                                index === itemIndex
                                  ? {
                                      ...entry,
                                      links: [...(entry.links ?? []), { url: "", label: "" }]
                                    }
                                  : entry
                              ))
                            }
                          >
                            <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addLink")}</span>
                          </button>
                        </div>
                        {(item.links ?? []).length === 0 ? (
                          <p className="muted">{t("admin.experiences.none")}</p>
                        ) : (
                          <div className="admin-form">
                            {(item.links ?? []).map((link, linkIndex) => (
                              <div key={`${link.url}-${linkIndex}`} className="admin-nested-card">
                                <div className="admin-list-header">
                                  <h5>
                                    {t("admin.experiences.linkLabel").replace(
                                      "{name}",
                                      resolveLocalizedText(link.label ?? "", language)
                                        || String(linkIndex + 1)
                                    )}
                                  </h5>
                                  <button
                                    type="button"
                                    className="admin-danger"
                                    onClick={() =>
                                      onChange((items ?? []).map((entry, index) =>
                                        index === itemIndex
                                          ? {
                                              ...entry,
                                              links: (entry.links ?? []).filter((_value, idx) => idx !== linkIndex)
                                            }
                                          : entry
                                      ))
                                    }
                                  >
                                    <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removeLink")}</span>
                                  </button>
                                </div>
                                <label className="admin-field">
                                  <span>{t("admin.fields.url")}</span>
                                  <input
                                    value={link.url}
                                    onChange={(event) =>
                                      onChange((items ?? []).map((entry, index) =>
                                        index === itemIndex
                                          ? {
                                              ...entry,
                                              links: (entry.links ?? []).map((value, idx) =>
                                                idx === linkIndex ? { ...value, url: event.target.value } : value
                                              )
                                            }
                                          : entry
                                      ))
                                    }
                                  />
                                </label>
                                <LocalizedTextField
                                  languageOptions={listingOptions}
                                  label={t("admin.fields.label")}
                                  value={link.label ?? ""}
                                  onChange={(nextValue) =>
                                    onChange((items ?? []).map((entry, index) =>
                                      index === itemIndex
                                        ? {
                                            ...entry,
                                            links: (entry.links ?? []).map((value, idx) =>
                                              idx === linkIndex ? { ...value, label: nextValue } : value
                                            )
                                          }
                                        : entry
                                    ))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null
                )}
              </>
            )}
          </div>
        );
      };
      const sections = places.sections ?? [];
      const placesSectionKey = getPlacesSectionKey(property.id);
      const activeSectionIndex = Math.min(
        Math.max(activePlacesSectionIndexByKey[placesSectionKey] ?? 0, 0),
        Math.max(sections.length - 1, 0)
      );
      const categoryOptions = sections.map((section, sectionIndex) => {
        const title =
          resolveLocalizedText(section.title ?? "", language)
          || t("admin.places.sectionLabel").replace("{index}", String(sectionIndex + 1));
        const value = section.categoryValue?.trim() || title.trim();
        return { value, label: title };
      });
      const categoryMetaByValue = sections.reduce<Record<string, { icon?: string; color?: string }>>(
        (acc, section, index) => {
        const title =
          resolveLocalizedText(section.title ?? "", language)
          || t("admin.places.sectionLabel").replace("{index}", String(index + 1));
        const value = section.categoryValue?.trim() || title.trim();
        const icon = section.icon?.trim() || undefined;
        const color = section.color?.trim() || undefined;
        if (value && (icon || color)) {
          acc[value] = { icon, color };
        }
        return acc;
      }, {});

      return (
        <div className="admin-tab-page">
          <div className="admin-tab-page-header">
            <h2>{t("admin.tabs.places")}</h2>
          </div>
          <div className="admin-form">
            <LocalizedTextField
              languageOptions={listingOptions}
              label={t("admin.places.pageTitle")}
              value={places.pageTitle ?? ""}
              onChange={(nextValue) =>
                updatePlaces((page) => ({ ...page, pageTitle: nextValue }))
              }
            />
            <LocalizedRichTextField
              languageOptions={listingOptions}
              label={t("admin.places.pageDescription")}
              value={places.description ?? ""}
              rows={4}
              onChange={(nextValue) =>
                updatePlaces((page) => ({ ...page, description: nextValue }))
              }
            />
            <div className="admin-from-section">
              <div className="admin-form-section-header">
                <h4>{t("admin.places.sections")}</h4>
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() =>
                    updatePlaces((page) => {
                      const nextSections = [...(page.sections ?? []), newPlacesSection()];
                      setActivePlacesSectionIndexByKey((prev) => ({
                        ...prev,
                        [placesSectionKey]: nextSections.length - 1
                      }));
                      return {
                        ...page,
                        sections: nextSections
                      };
                    })
                  }
                >
                  <FontAwesomeIcon icon={faPlus} /><span>{t("admin.places.addSection")}</span>
                </button>
              </div>
              {sections.length === 0 ? (
                <p className="muted">{t("admin.places.sectionsEmpty")}</p>
              ) : (
                <>
                  <div className="admin-tabs">
                    {sections.map((section, sectionIndex) => (
                      <button
                        key={`places-section-tab-${section.id}`}
                        type="button"
                        className={`admin-tab${sectionIndex === activeSectionIndex ? " active" : ""}`}
                        onClick={() =>
                          setActivePlacesSectionIndexByKey((prev) => ({
                            ...prev,
                            [placesSectionKey]: sectionIndex
                          }))
                        }
                      >
                        {resolveLocalizedText(section.title ?? "", language)
                          || t("admin.places.sectionLabel").replace("{index}", String(sectionIndex + 1))}
                      </button>
                    ))}
                  </div>
                  {sections.map((section, sectionIndex) =>
                    sectionIndex === activeSectionIndex ? (
                      <div key={section.id} className="admin-nested-card">
                        <div className="admin-list-header">
                          <h4>
                            {resolveLocalizedText(section.title ?? "", language)
                              || t("admin.places.sectionLabel").replace("{index}", String(sectionIndex + 1))}
                          </h4>
                          <button
                            type="button"
                            className="admin-danger"
                            onClick={() => {
                              updatePlaces((page) => ({
                                ...page,
                                sections: (page.sections ?? []).filter((_value, index) => index !== sectionIndex)
                              }));
                              setActivePlacesSectionIndexByKey((prev) => ({
                                ...prev,
                                [placesSectionKey]: Math.max(sectionIndex - 1, 0)
                              }));
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} /><span>{t("admin.places.removeSection")}</span>
                          </button>
                        </div>
                        <LocalizedTextField
                          languageOptions={listingOptions}
                          label={t("admin.places.sectionTitle")}
                          value={section.title ?? ""}
                          onChange={(nextValue) =>
                            updatePlaces((page) => ({
                              ...page,
                              sections: (page.sections ?? []).map((value, index) =>
                                index === sectionIndex ? { ...value, title: nextValue } : value
                              )
                            }))
                          }
                        />
                        <LocalizedRichTextField
                          languageOptions={listingOptions}
                          label={t("admin.places.sectionDescription")}
                          value={section.description ?? ""}
                          rows={3}
                          onChange={(nextValue) =>
                            updatePlaces((page) => ({
                              ...page,
                              sections: (page.sections ?? []).map((value, index) =>
                                index === sectionIndex ? { ...value, description: nextValue } : value
                              )
                            }))
                          }
                        />
                        <label className="admin-field">
                          <span>{t("admin.places.sectionIcon")}</span>
                          <div className="admin-inline-input">
                            <button
                              type="button"
                              className="admin-tag-icon-button"
                              aria-label={t("admin.facilities.chooseIcon")}
                              onClick={() =>
                                setActivePlacesIconPicker((prev) =>
                                  prev?.propertyId === property.id && prev?.sectionIndex === sectionIndex
                                    ? null
                                    : { propertyId: property.id, sectionIndex }
                                )
                              }
                            >
                              <i className={getIconClassName(section.icon ?? undefined)} />
                            </button>
                            <span className="admin-icon-label">
                              {section.icon?.trim() || t("admin.places.sectionIconPlaceholder")}
                            </span>
                          </div>
                          {activePlacesIconPicker?.propertyId === property.id &&
                          activePlacesIconPicker?.sectionIndex === sectionIndex ? (
                            <div className="admin-icon-callout">
                              <FacilityIconPicker
                                header={
                                  iconLoadError ? (
                                    <span className="muted">
                                      Icon load issue: {iconLoadError}
                                    </span>
                                  ) : null
                                }
                                options={facilityIconOptions}
                                totalCount={facilityIconOptions.length}
                                selected={normalizeIconValue(section.icon ?? "")}
                                onSelect={(value) => {
                                  updatePlaces((page) => ({
                                    ...page,
                                    sections: (page.sections ?? []).map((entry, index) =>
                                      index === sectionIndex ? { ...entry, icon: value } : entry
                                    )
                                  }));
                                  setActivePlacesIconPicker(null);
                                }}
                              />
                            </div>
                          ) : null}
                        </label>
                        <label className="admin-field">
                          <span>{t("admin.places.sectionCategory")}</span>
                          <input
                            value={section.categoryValue ?? ""}
                            placeholder={t("admin.places.sectionCategoryPlaceholder")}
                            onChange={(event) =>
                              updatePlaces((page) => ({
                                ...page,
                                sections: (page.sections ?? []).map((value, index) =>
                                  index === sectionIndex
                                    ? { ...value, categoryValue: event.target.value }
                                    : value
                                )
                              }))
                            }
                          />
                        </label>
                        <label className="admin-field">
                          <span>{t("admin.places.sectionColor")}</span>
                          <div className="admin-inline-input">
                            <input
                              className="admin-color-input"
                              type="color"
                              value={section.color ?? "#64748b"}
                              onChange={(event) =>
                                updatePlaces((page) => ({
                                  ...page,
                                  sections: (page.sections ?? []).map((value, index) =>
                                    index === sectionIndex
                                      ? { ...value, color: event.target.value }
                                      : value
                                  )
                                }))
                              }
                            />
                            <input
                              value={section.color ?? ""}
                              placeholder="#64748b"
                              onChange={(event) =>
                                updatePlaces((page) => ({
                                  ...page,
                                  sections: (page.sections ?? []).map((value, index) =>
                                    index === sectionIndex
                                      ? { ...value, color: event.target.value }
                                      : value
                                  )
                                }))
                              }
                            />
                          </div>
                        </label>
                      </div>
                    ) : null
                  )}
                </>
              )}
            </div>
            {renderExperienceItems(
              places.items ?? [],
              (nextItems) => updatePlaces((page) => ({ ...page, items: nextItems })),
              true,
              getExperienceKey(property.id, "places"),
              categoryOptions,
              categoryMetaByValue
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "theme") {
      const selectedThemeName = draft.themeName ?? "";
      const selectedTheme = themes.find((item) => item.name === selectedThemeName) ?? null;
      const theme = selectedTheme ?? draft.theme ?? resolveTheme(null);
      const canCreatePrivateTheme = !selectedTheme?.isPrivate;
      const lightPreviewVars: AdminThemeVars = {
        "--preview-background": theme.light.background,
        "--preview-surface": theme.light.surface,
        "--preview-text": theme.light.text,
        "--preview-muted": theme.light.muted,
        "--preview-primary": theme.light.primary,
        "--preview-accent": theme.light.accent,
        "--preview-border": theme.light.border,
        "--preview-shadow": theme.light.shadow,
        "--preview-text-shadow": theme.light.textShadow ?? "none"
      };
      const darkPreviewVars: AdminThemeVars = {
        "--preview-background": theme.dark.background,
        "--preview-surface": theme.dark.surface,
        "--preview-text": theme.dark.text,
        "--preview-muted": theme.dark.muted,
        "--preview-primary": theme.dark.primary,
        "--preview-accent": theme.dark.accent,
        "--preview-border": theme.dark.border,
        "--preview-shadow": theme.dark.shadow,
        "--preview-text-shadow": theme.dark.textShadow ?? "none"
      };
      return (
        <div className="admin-tab-page">
          <h2>{t("admin.theme.title")}</h2>
          <div className="admin-form admin-form-inline">
            <div className="admin-field">
              <span>{t("admin.theme.label")}</span>
              <div className="admin-inline-row">
                <AdminSelect
                  value={selectedThemeName}
                  options={themes.map((item) => ({
                    value: item.name,
                    label: item.displayName
                  }))}
                  onChange={(value) =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      themeName: value
                    }))
                  }
                />
                {canCreatePrivateTheme ? (
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() =>
                      router.push(
                        `/admin/themes${selectedThemeName ? `?base=${selectedThemeName}` : ""}`
                      )
                    }
                  >
                    {t("admin.theme.createPrivate")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="admin-theme-grid">
            <div className="admin-nested-card admin-theme-card" style={lightPreviewVars}>
              <h3>{t("admin.theme.preview.light")}</h3>
              <div className="admin-theme-preview">
                <div className="admin-theme-preview-surface">
                  <h1>{t("admin.theme.preview.sampleTitle")}</h1>
                  <h2>{t("admin.theme.preview.sampleSubtitle")}</h2>
                  <h3>{t("admin.theme.preview.sampleParagraphTitle")}</h3>
                  <h4>{t("admin.theme.preview.sampleHeading")}</h4>
                  <h5>{t("admin.theme.preview.sampleSubheading")}</h5>
                  <h6>{t("admin.theme.preview.sampleParagraphHeading")}</h6>
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
                  <div className="admin-theme-preview-chip">{t("admin.theme.preview.sampleBorder")}</div>
                </div>
              </div>
            </div>
            <div
              className="admin-nested-card admin-theme-card admin-theme-card-dark"
              style={darkPreviewVars}
            >
              <h3>{t("admin.theme.preview.dark")}</h3>
              <div className="admin-theme-preview">
                <div className="admin-theme-preview-surface">
                  <h1>{t("admin.theme.preview.sampleTitle")}</h1>
                  <h2>{t("admin.theme.preview.sampleSubtitle")}</h2>
                  <h3>{t("admin.theme.preview.sampleParagraphTitle")}</h3>
                  <h4>{t("admin.theme.preview.sampleHeading")}</h4>
                  <h5>{t("admin.theme.preview.sampleSubheading")}</h5>
                  <h6>{t("admin.theme.preview.sampleParagraphHeading")}</h6>
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
                  <div className="admin-theme-preview-chip">{t("admin.theme.preview.sampleBorder")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "facts") {
      const facts = draft.facts ?? {};
      const updateFacts = (key: keyof NonNullable<PropertyDto["facts"]>, value: number | null) =>
        updateDraft(property.id, (current) => ({
          ...current,
          facts: {
            ...facts,
            [key]: value
          }
        }));
      return (
        <div className="admin-tab-page">
          <h2>{t("admin.facts.title")}</h2>
          <div className="admin-form admin-facts-grid">
            {([
              ["bedrooms", t("admin.facts.bedrooms")],
              ["bathrooms", t("admin.facts.bathrooms")],
              ["kitchens", t("admin.facts.kitchens")],
              ["interiorAreaSqm", t("admin.facts.interior")],
              ["landAreaSqm", t("admin.facts.land")]
            ] as const).map(([key, label]) => (
              <label key={key} className="admin-field">
                <span>{label}</span>
                <input
                  type="number"
                  value={facts[key] ?? ""}
                  onChange={(event) =>
                    updateFacts(key, event.target.value === "" ? null : Number(event.target.value))
                  }
                />
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "links") {
      const links = draft.externalLinks ?? [];
      return (
        <div className="admin-tab-page">
          <div className="admin-list-header">
            <h2>{t("admin.links.title")}</h2>
            <button
              type="button"
              className="admin-secondary"
              onClick={() =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  externalLinks: [...(current.externalLinks ?? []), { url: "", label: "" }]
                }))
              }
            >
              {t("admin.actions.addLink")}
            </button>
          </div>
          {links.map((link, index) => (
            <div key={`${link.url}-${index}`} className="admin-nested-card admin-link-row">
              <div className="admin-link-row-header">
                <LocalizedTextField
                  languageOptions={listingOptions}
                  className="admin-link-field"
                  label={t("admin.fields.label")}
                  value={link.label ?? ""}
                  placeholder={t("admin.fields.label")}
                  onChange={(nextValue) =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      externalLinks: (current.externalLinks ?? []).map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: nextValue } : item
                      )
                    }))
                  }
                />
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      externalLinks: (current.externalLinks ?? []).filter(
                        (_item, itemIndex) => itemIndex !== index
                      )
                    }))
                  }
                >
                  <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removeLink")}</span>
                </button>
              </div>
              <label className="admin-field admin-link-field">
                <input
                  value={link.url}
                  placeholder={t("admin.fields.url")}
                  onChange={(event) =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      externalLinks: (current.externalLinks ?? []).map((item, itemIndex) =>
                        itemIndex === index ? { ...item, url: event.target.value } : item
                      )
                    }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "location") {
      const location = draft.location ?? { address: "", mapEmbedUrl: "", description: "" };
      return (
        <div className="admin-tab-page">
          <h2>{t("admin.location.title")}</h2>
          <LocalizedTextField
            languageOptions={listingOptions}
            label={t("admin.fields.address")}
            value={location.address}
            onChange={(nextValue) =>
              updateDraft(property.id, (current) => ({
                ...current,
                location: { ...location, address: nextValue }
              }))
            }
          />
          <label className="admin-field">
            <span>{t("admin.fields.mapEmbedUrl")}</span>
            <input
              value={location.mapEmbedUrl ?? ""}
              onChange={(event) =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  location: { ...location, mapEmbedUrl: event.target.value }
                }))
              }
            />
          </label>
          <LocalizedRichTextField
            languageOptions={listingOptions}
            label={t("admin.fields.description")}
            value={location.description ?? ""}
            rows={2}
            onChange={(nextValue) =>
              updateDraft(property.id, (current) => ({
                ...current,
                location: { ...location, description: nextValue }
              }))
            }
          />
        </div>
      );
    }

    if (activeTab === "facilities") {
      const facilities = normalizeFacilities(draft.facilities ?? []);
      return (
        <div className="admin-tab-page">
          <h2>{t("admin.facilities.title")}</h2>
          <div className="admin-list-header">
            <h4>{t("admin.facilities.groups")}</h4>
            <button
              type="button"
              className="admin-secondary"
              onClick={() =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  facilities: [...(current.facilities ?? []), { title: t("admin.facilities.newGroup"), icon: "regular:circle-check", items: [] }]
                }))
              }
            >
              <FontAwesomeIcon icon={faObjectGroup} /><span>{t("admin.actions.addGroup")}</span>
            </button>
          </div>
          {facilities.map((group, index) => (
            <div key={`group-${index}`} className="admin-nested-card">
              <div className="inline-admin-list-header admin-group-header">
                <div className="admin-group-header-main">
                  <span>{t("admin.facilities.groupTitle").replace("{index}", String(index + 1))}</span>
                  <div className="localized-tabs">
                    {listingOptions.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={option.code === language ? "admin-tab active" : "admin-tab"}
                        onClick={() => setLanguage(option.code)}
                        aria-label={`${t("admin.facilities.groupTitleShort")}: ${option.label}`}
                      >
                        {option.flag}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="admin-tag-icon-button"
                    aria-label={t("admin.facilities.chooseIcon")}
                    onClick={() =>
                      setActiveFacilityIconPicker((prev) =>
                        prev?.groupIndex === index && prev?.itemIndex === null ? null : { groupIndex: index, itemIndex: null }
                      )
                    }
                  >
                    <i className={getIconClassName(group.icon ?? "regular:circle-check")} />
                  </button>
                  {activeFacilityIconPicker?.groupIndex === index && activeFacilityIconPicker?.itemIndex === null ? (
                    <div className="admin-icon-callout">
                      <FacilityIconPicker
                        header={
                          iconLoadError ? (
                            <span className="muted">Icon load issue: {iconLoadError}</span>
                          ) : null
                        }
                        options={facilityIconOptions}
                        totalCount={facilityIconOptions.length}
                        selected={normalizeIconValue(group.icon ?? "regular:circle-check")}
                        onSelect={(value) => {
                          updateDraft(property.id, (current) => ({
                            ...current,
                            facilities: normalizeFacilities(current.facilities ?? []).map((facility, facilityIndex) =>
                              facilityIndex === index ? { ...facility, icon: value } : facility
                            )
                          }));
                          setActiveFacilityIconPicker(null);
                        }}
                      />
                    </div>
                  ) : null}
                  <label className="admin-field">
                    <input
                      value={resolveLocalizedText(group.title, language)}
                      onChange={(event) =>
                        updateDraft(property.id, (current) => ({
                          ...current,
                      facilities: normalizeFacilities(current.facilities ?? []).map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: setLocalizedValue(item.title, language, event.target.value) } : item
                      )
                        }))
                      }
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      facilities: (current.facilities ?? []).filter(
                        (_item, itemIndex) => itemIndex !== index
                      )
                    }))
                  }
                >
                  <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removeGroup")}</span>
                </button>
              </div>
              <div className="admin-list">
                <div className="admin-list-header admin-list-header-leading">
                  <span>{t("admin.facilities.groupItems")}</span>
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() => {
                      updateDraft(property.id, (current) => ({
                        ...current,
                      facilities: normalizeFacilities(current.facilities ?? []).map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                items: [
                                  ...item.items,
                                  { text: "" }
                                ]
                              }
                            : item
                        )
                      }));
                      setFacilityFocus({ groupIndex: index, itemIndex: group.items.length });
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addFacility")}</span>
                  </button>
                </div>
                <div className="admin-tag-cloud">
                  {group.items.map((item, itemIndex) => (
                    <div key={`facility-${index}-${itemIndex}`} className="admin-tag-wrapper">
                      <div className="admin-tag">
                        <span className="admin-tag-icon-button" aria-hidden="true">
                          <i className={getIconClassName("regular:circle-check")} />
                        </span>
                        <input
                          className="admin-tag-input"
                          value={resolveLocalizedText(item.text, language)}
                          size={Math.max(resolveLocalizedText(item.text, language).length, 1)}
                          autoFocus={
                            facilityFocus?.groupIndex === index &&
                            facilityFocus?.itemIndex === itemIndex
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.currentTarget.blur();
                            }
                          }}
                          onBlur={() => {
                            if (
                              facilityFocus?.groupIndex === index &&
                              facilityFocus?.itemIndex === itemIndex
                            ) {
                              setFacilityFocus(null);
                            }
                          }}
                          onChange={(event) =>
                            updateDraft(property.id, (current) => ({
                              ...current,
                              facilities: normalizeFacilities(current.facilities ?? []).map(
                                (facility, facilityIndex) =>
                                  facilityIndex === index
                                    ? {
                                        ...facility,
                                        items: facility.items.map((value, valueIndex) =>
                                          valueIndex === itemIndex
                                            ? { text: setLocalizedValue(value.text, language, event.target.value) }
                                            : value
                                        )
                                      }
                                    : facility
                              )
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="admin-tag-remove"
                          aria-label={t("admin.actions.removeItem")}
                          onClick={() =>
                            updateDraft(property.id, (current) => ({
                              ...current,
                              facilities: normalizeFacilities(current.facilities ?? []).map(
                                (facility, facilityIndex) =>
                                  facilityIndex === index
                                    ? {
                                        ...facility,
                                        items: facility.items.filter(
                                          (_value, valueIndex) => valueIndex !== itemIndex
                                        )
                                      }
                                    : facility
                              )
                            }))
                          }
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "pdfs") {
      const pdfs = draft.pdfs ?? [];
      return (
        <div className="admin-tab-page">
          <div className="admin-list-header">
            <h2>{t("admin.pdfs.title")}</h2>
            <button
              type="button"
              className="admin-secondary"
              onClick={() =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  pdfs: [...(current.pdfs ?? []), { id: "", title: "", type: "other", src: "" }]
                }))
              }
            >
              <FontAwesomeIcon icon={faPaperclip} /><span>{t("admin.actions.addPdf")}</span>
            </button>
          </div>
          {pdfs.map((pdf, index) => (
            <div key={`${pdf.id}-${index}`} className="admin-nested-card admin-link-row">
              <div className="admin-link-row-header">
                <label className="admin-field" style={{ flex: "initial" }}>
                  <span>{t("admin.fields.id")}</span>
                  <input
                    value={pdf.id}
                    placeholder={t("admin.fields.id")}
                    style={{ width: "15em" }}
                    onChange={(event) =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pdfs: (current.pdfs ?? []).map((item, itemIndex) =>
                          itemIndex === index ? { ...item, id: event.target.value } : item
                        )
                      }))
                    }
                  />
                </label>
                <label className="admin-field" style={{ flex: "auto" }}>
                  <span>{t("admin.fields.title")}</span>
                  <div className="localized-tabs">
                    {listingOptions.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={option.code === language ? "admin-tab active" : "admin-tab"}
                        onClick={() => setLanguage(option.code)}
                        aria-label={`${t("admin.fields.title")}: ${option.label}`}
                      >
                        {option.flag}
                      </button>
                    ))}
                  </div>
                  <input
                    value={resolveLocalizedText(pdf.title, language)}
                    placeholder={t("admin.fields.title")}
                    onChange={(event) =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pdfs: (current.pdfs ?? []).map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: setLocalizedValue(item.title, language, event.target.value) } : item
                        )
                      }))
                    }
                  />
                </label>
              </div>
              <div className="admin-link-row-header">
                <label className="admin-field" style={{ flex: "initial" }}>
                  <span>{t("admin.pdfs.type")}</span>
                  <input
                    value={pdf.type}
                    placeholder={t("admin.pdfs.type")}
                    style={{ width: "15em" }}
                    onChange={(event) =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pdfs: (current.pdfs ?? []).map((item, itemIndex) =>
                          itemIndex === index ? { ...item, type: event.target.value } : item
                        )
                      }))
                    }
                  />
                </label>
                <label className="admin-field" style={{ flex: "auto" }}>
                  <span>{t("admin.pdfs.url")}</span>
                  <input
                    value={pdf.src}
                    placeholder={t("admin.pdfs.url")}
                    onChange={(event) =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        pdfs: (current.pdfs ?? []).map((item, itemIndex) =>
                          itemIndex === index ? { ...item, src: event.target.value } : item
                        )
                      }))
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className="admin-danger fit-content"
                onClick={() =>
                  updateDraft(property.id, (current) => ({
                    ...current,
                    pdfs: (current.pdfs ?? []).filter(
                      (_item, itemIndex) => itemIndex !== index
                    )
                  }))
                }
              >
                <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removePdf")}</span>
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "salesRental") {
      const salesParticulars = draft.salesParticulars ?? { price: "", documents: [] };
      const rentalUnits = getRentalUnits(draft);
      const selectedUnitIndex = Math.min(
        Math.max(0, activeRentalUnitById[property.id] ?? 0),
        Math.max(0, rentalUnits.length - 1)
      );
      const rental = rentalUnits[selectedUnitIndex] ?? defaultRental();
      const providers = (draft.externalLinks ?? [])
        .map((link) => getProviderLabel(link.url, t))
        .filter((provider, index, list) => list.indexOf(provider) === index);
      const hasAirbnb = (draft.externalLinks ?? []).some((link) =>
        link.url.toLowerCase().includes("airbnb.")
      );
      const listingStatus = (draft.status ?? "").toLowerCase();
      const showSalesParticulars = listingStatus === "sale" || listingStatus === "both";
      const showRentalDetails = listingStatus === "rental" || listingStatus === "both";
      const icalKey = icalStateKey(property.id, selectedUnitIndex);
      return (
        <div className="admin-tab-page">
          {showSalesParticulars ? (
          <div className="admin-form-section">
            <h3>{t("admin.particulars.sales")}</h3>
            <div className="admin-nested-card">
              <label className="admin-field">
                <span>{t("admin.particulars.price")}</span>
                <input
                  value={salesParticulars.price ?? ""}
                  onChange={(event) =>
                    updateDraft(property.id, (current) => ({
                      ...current,
                      salesParticulars: {
                        ...salesParticulars,
                        price: event.target.value
                      }
                    }))
                  }
                />
              </label>
              <div className="admin-list">
                <div className="admin-list-header">
                  <h5>{t("admin.particulars.documents")}</h5>
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() =>
                      updateDraft(property.id, (current) => ({
                        ...current,
                        salesParticulars: {
                          ...salesParticulars,
                          documents: [...(salesParticulars.documents ?? []), ""]
                        }
                      }))
                    }
                  >
                    <FontAwesomeIcon icon={faPaperclip} /><span>{t("admin.actions.addDocument")}</span>
                  </button>
                </div>
                {(salesParticulars.documents ?? []).map((doc, index) => (
                  <div key={`${doc}-${index}`} className="admin-inline-row">
                    <input
                      value={doc}
                      placeholder={t("admin.particulars.documentPath")}
                      onChange={(event) =>
                        updateDraft(property.id, (current) => ({
                          ...current,
                          salesParticulars: {
                            ...salesParticulars,
                            documents: (salesParticulars.documents ?? []).map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item
                            )
                          }
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="admin-danger fit-content"
                      onClick={() =>
                        updateDraft(property.id, (current) => ({
                          ...current,
                          salesParticulars: {
                            ...salesParticulars,
                            documents: (salesParticulars.documents ?? []).filter(
                              (_item, itemIndex) => itemIndex !== index
                            )
                          }
                        }))
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removeDocument")}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : null}

          {showRentalDetails ? (
            <div className="admin-form-section">
              <h3>{t("admin.rental.title")}</h3>
              <div className="admin-tabs admin-tabs--units">
                {(rentalUnits.length ? rentalUnits : [defaultRental()]).map((unit, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`admin-tab${selectedUnitIndex === i ? " active" : ""}`}
                    onClick={() =>
                      setActiveRentalUnitById((prev) => ({ ...prev, [property.id]: i }))
                    }
                  >
                    {unit.name?.trim()
                      ? t("admin.rental.unitLabelNamed").replace("{name}", unit.name.trim())
                      : t("admin.rental.unitLabel").replace("{n}", String(i + 1))}
                  </button>
                ))}
                <button
                  type="button"
                  className="admin-tab admin-tab--add"
                  onClick={() => {
                    updateDraft(property.id, (current) => {
                      const units = getRentalUnits(current);
                      return { ...current, rentalUnits: [...units, defaultRental()] };
                    });
                    setActiveRentalUnitById((prev) => ({
                      ...prev,
                      [property.id]: rentalUnits.length
                    }));
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} /><span>{t("admin.rental.addUnit")}</span>
                </button>
              </div>

            <div className="admin-nested-card">
              <label className="admin-field">
                <span>{t("admin.rental.unitName")}</span>
                <input
                  value={rental.name ?? ""}
                  placeholder={t("admin.rental.unitNamePlaceholder")}
                  onChange={(event) =>
                    updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                      ...unit,
                      name: event.target.value || null
                    }))
                  }
                />
              </label>

              {/* rates */}
              <div className="admin-nested-card">
                <div className="admin-list">
                  <div className="admin-list-header">
                    <h5>{t("admin.rental.rates")}</h5>
                    <div className="admin-list-header-actions">
                      {rentalUnits.length >= 2 &&
                        (rentalUnits ?? []).some(
                          (u, i) => i !== selectedUnitIndex && (u.rates ?? []).length > 0
                        ) && (
                          <AdminSelect
                            value=""
                            placeholder={t("admin.rental.copyRatesFromPlaceholder")}
                            options={[
                              { value: "", label: t("admin.rental.copyRatesFromPlaceholder") },
                              ...(rentalUnits ?? [])
                                .map((u, i) =>
                                  i !== selectedUnitIndex
                                    ? {
                                        value: String(i),
                                        label: t("admin.rental.copyRatesFromUnit").replace(
                                          "{name}",
                                          u.name?.trim() ?? t("admin.rental.unitLabel").replace("{n}", String(i + 1))
                                        )
                                      }
                                    : null
                                )
                                .filter((x): x is { value: string; label: string } => x != null)
                            ]}
                            onChange={(nextValue) => {
                              const idx = Number(nextValue);
                              if (!Number.isInteger(idx) || idx < 0) return;
                              const source = rentalUnits[idx];
                              if (!source?.rates?.length) return;
                              updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                                ...unit,
                                rates: [
                                  ...(unit.rates ?? []),
                                  ...(source.rates ?? []).map((r) => ({ ...r }))
                                ]
                              }));
                            }}
                          />
                        )}
                      <button
                        type="button"
                        className="admin-secondary"
                        onClick={() =>
                          updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                            ...unit,
                            rates: [...(unit.rates ?? []), { season: "", pricePerWeek: "" }]
                          }))
                        }
                      >
                        <FontAwesomeIcon icon={faMoneyBills} /><span>{t("admin.actions.addRate")}</span>
                      </button>
                    </div>
                  </div>
                {(rental.rates ?? []).map((rate, index) => (
                  <div key={`rate-${selectedUnitIndex}-${index}`} className="admin-inline-row">
                    <input
                      className="admin-input-name"
                      value={rate.season}
                      placeholder={t("admin.rental.seasonPlaceholder")}
                      onChange={(event) =>
                        updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                          ...unit,
                          rates: (unit.rates ?? []).map((item, itemIndex) =>
                            itemIndex === index ? { ...item, season: event.target.value } : item
                          )
                        }))
                      }
                    />
                    <input
                      className="admin-input-rate"
                      value={rate.pricePerWeek ?? ""}
                      placeholder={t("admin.rental.ratePlaceholder")}
                      onChange={(event) =>
                        updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                          ...unit,
                          rates: (unit.rates ?? []).map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, pricePerWeek: event.target.value }
                              : item
                          )
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="admin-danger fit-content"
                      onClick={() =>
                        updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                          ...unit,
                          rates: (unit.rates ?? []).filter((_item, itemIndex) => itemIndex !== index)
                        }))
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                </div>
              </div>

              {/* rental conditions */}
              <div className="admin-nested-card">
                <div className="admin-list">
                  <div className="admin-list-header">
                    <h5>{t("admin.rental.conditions")}</h5>
                    <div className="admin-list-header-actions">
                      {rentalUnits.length >= 2 &&
                        (rentalUnits ?? []).some(
                          (u, i) => i !== selectedUnitIndex && (u.conditions ?? []).length > 0
                        ) && (
                          <AdminSelect
                            value=""
                            placeholder={t("admin.rental.copyConditionsFromPlaceholder")}
                            options={[
                              { value: "", label: t("admin.rental.copyConditionsFromPlaceholder") },
                              ...(rentalUnits ?? [])
                                .map((u, i) =>
                                  i !== selectedUnitIndex
                                    ? {
                                        value: String(i),
                                        label: t("admin.rental.copyConditionsFromUnit").replace(
                                          "{name}",
                                          u.name?.trim() ?? t("admin.rental.unitLabel").replace("{n}", String(i + 1))
                                        )
                                      }
                                    : null
                                )
                                .filter((x): x is { value: string; label: string } => x != null)
                            ]}
                            onChange={(nextValue) => {
                              const idx = Number(nextValue);
                              if (!Number.isInteger(idx) || idx < 0) return;
                              const source = rentalUnits[idx];
                              if (!source?.conditions?.length) return;
                              updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                                ...unit,
                                conditions: [
                                  ...(unit.conditions ?? []),
                                  ...(source.conditions ?? [])
                                ]
                              }));
                            }}
                          />
                        )}
                      <button
                        type="button"
                        className="admin-secondary"
                        onClick={() =>
                          updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                            ...unit,
                            conditions: [...(unit.conditions ?? []), ""]
                          }))
                        }
                      >
                        <FontAwesomeIcon icon={faLegal} /><span>{t("admin.actions.addCondition")}</span>
                      </button>
                    </div>
                  </div>
                {(rental.conditions ?? []).map((condition, index) => (
                  <div key={`condition-${selectedUnitIndex}-${index}`} className="admin-inline-row">
                    <input
                      className="admin-input-name"
                      value={condition}
                      placeholder={t("admin.rental.conditionPlaceholder")}
                      onChange={(event) =>
                        updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                          ...unit,
                          conditions: (unit.conditions ?? []).map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          )
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="admin-danger fit-content"
                      onClick={() =>
                        updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                          ...unit,
                          conditions: (unit.conditions ?? []).filter(
                            (_item, itemIndex) => itemIndex !== index
                          )
                        }))
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                </div>
              </div>

              {/* iCal */}
              <div className="admin-nested-card">
                <div className="admin-list">
                  <div className="admin-list-header">
                    <h5>{t("admin.rental.icalTitle")}</h5>
                    {hasAirbnb ? (
                      <button
                        type="button"
                        className="admin-secondary"
                        onClick={() => onFetchIcalAvailability(property.id, selectedUnitIndex)}
                        disabled={!rental.icalUrl}
                      >
                        <FontAwesomeIcon icon={faCalendar} /><span>{t("admin.rental.fetchIcal")}</span>
                      </button>
                    ) : null}
                  </div>
                  {hasAirbnb ? (
                    <>
                      <label className="admin-field">
                        <span>{t("admin.rental.icalUrl")}</span>
                        <input
                          value={rental.icalUrl ?? ""}
                          placeholder={t("admin.rental.icalPlaceholder")}
                          onChange={(event) =>
                            updateRentalUnit(property.id, selectedUnitIndex, (unit) => ({
                              ...unit,
                              icalUrl: event.target.value
                            }))
                          }
                        />
                      </label>
                      {rental.icalUrl ? (
                        <div className="admin-ical-results">
                          {icalLoadingById[icalKey] ? (
                          <p className="muted">{t("admin.rental.loadingIcal")}</p>
                          ) : icalErrorById[icalKey] ? (
                            <p className="admin-error">{icalErrorById[icalKey]}</p>
                          ) : (icalAvailabilityById[icalKey] ?? []).length === 0 ? (
                            <p className="muted">{t("admin.rental.noBlockedDates")}</p>
                          ) : (
                            <ul className="admin-availability-list">
                              {(icalAvailabilityById[icalKey] ?? []).map((range, rangeIndex) => (
                                <li key={`${range.start}-${range.end}-${rangeIndex}`}>
                                  <span className="admin-availability-dates">
                                    {range.start} → {range.end}
                                  </span>
                                  {range.summary ? (
                                    <span className="admin-availability-summary">
                                      {range.summary}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <p className="muted">{t("admin.rental.addIcalHint")}</p>
                      )}
                    </>
                  ) : (
                    <p className="muted">
                      {t("admin.rental.icalNotice")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          ) : null}
        </div>
      );
    }

    if (activeTab === "bookings") {
      const rental = getRentalUnits(draft)[0] ?? defaultRental();
      const isReadOnly = isPropertyManager;
      return (
        <div className="admin-tab-page">
          <div className="admin-list">
            <div className="admin-list-header">
              <h2>{t("admin.bookings.title")}</h2>
              <div className="admin-button-row">
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() =>
                    setShowBookingGapsById((prev) => ({
                      ...prev,
                      [property.id]: !(prev[property.id] ?? false)
                    }))
                  }
                >
                  {showBookingGapsById[property.id] ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}<span>{showBookingGapsById[property.id] ? t("admin.bookings.hideGaps") : t("admin.bookings.showGaps")}</span>
                </button>
                {!isPropertyManager ? (
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() =>
                      updateDraft(property.id, (current) =>
                        updateFirstRentalUnit(current, (unit) => ({
                          ...unit,
                          bookings: [
                            ...(unit.bookings ?? []),
                            { bookingId: createBookingId() }
                          ]
                        }))
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} /><span>{t("admin.actions.addBooking")}</span>
                  </button>
                ) : null}
              </div>
            </div>
            {(rental.bookings ?? []).length === 0 ? (
              <p className="muted">{t("admin.bookings.none")}</p>
            ) : (
              (rental.bookings ?? [])
                .map((booking, index) => ({
                  booking,
                  index,
                  fromDate: parseDateValue(booking.from)
                }))
                .sort((left, right) => {
                  if (!left.fromDate && !right.fromDate) {
                    return 0;
                  }
                  if (!left.fromDate) {
                    return 1;
                  }
                  if (!right.fromDate) {
                    return -1;
                  }
                  return left.fromDate.getTime() - right.fromDate.getTime();
                })
                .map(({ booking, index, fromDate }, sortedIndex, sortedList) => {
                const bookingKey = `${property.id}-${index}`;
                const isExpanded = expandedBookingsByKey[bookingKey] ?? false;
                const isAirbnbSource = (booking.source ?? "").toLowerCase() === "airbnb";
                const bookingIdValue = booking.bookingId?.trim() ?? "";
                const bookingDateValue = booking.dateOfBooking?.trim() ?? "";
                const guestLink =
                  bookingIdValue && bookingDateValue
                    ? `${window.location.origin}/?id=${encodeURIComponent(property.id)}`
                      + `&source=guest&bookingId=${encodeURIComponent(bookingIdValue)}`
                      + `&bookingDate=${encodeURIComponent(bookingDateValue)}`
                    : "";
                const toDate = parseDateValue(booking.to);
                const nextBooking = sortedList[sortedIndex + 1]?.booking;
                const nextFromDate = parseDateValue(nextBooking?.from);
                const prevBooking = sortedList[sortedIndex - 1]?.booking;
                const prevToDate = parseDateValue(prevBooking?.to);
                const sameDayClean = isSameDay(toDate, nextFromDate);
                const cleanDateValue = toDate
                  ? nextFromDate && !sameDayClean
                    ? `${formatDateValue(toDate)} → ${formatDateValue(nextFromDate)}`
                    : formatDateValue(toDate)
                  : "";
                const gapDays =
                  prevToDate && fromDate
                    ? Math.max(
                        0,
                        Math.round(
                          (Date.UTC(
                            fromDate.getUTCFullYear(),
                            fromDate.getUTCMonth(),
                            fromDate.getUTCDate()
                          ) -
                            Date.UTC(
                              prevToDate.getUTCFullYear(),
                              prevToDate.getUTCMonth(),
                              prevToDate.getUTCDate()
                            )) /
                            86_400_000
                        )
                      )
                    : null;
                const gapStartDate =
                  gapDays !== null && prevToDate ? addDays(prevToDate, 1) : null;
                const gapEndDate =
                  gapDays !== null && fromDate ? addDays(fromDate, -1) : null;
                const computedNights = calculateNights(booking.from, booking.to);
                const nightsValue =
                  booking.nights ?? (computedNights !== null ? `${computedNights}` : "");
                const bookingDate = parseDateValue(booking.dateOfBooking);
                const defaultRate = getEurGbpRate(bookingDate);
                const exchangeRateValue = toNumber(booking.exchangeRateEurGbp) ?? defaultRate;
                const flightLookupState = flightLookupByKey[bookingKey];
                const incomeEurValue = toNumber(booking.incomeEur);
                const incomeGbpValue = toNumber(booking.incomeGbp);
                const derivedGbp =
                  incomeEurValue !== null ? incomeEurValue * exchangeRateValue : null;
                const derivedEur =
                  incomeGbpValue !== null ? incomeGbpValue / exchangeRateValue : null;
                const displayIncomeEur =
                  incomeEurValue !== null ? incomeEurValue : derivedEur;
                const displayIncomeGbp =
                  incomeGbpValue !== null ? incomeGbpValue : derivedGbp;
                const eurPerNightValue =
                  displayIncomeEur !== null && computedNights
                    ? formatMoney(displayIncomeEur / computedNights)
                    : booking.eurPerNight ?? "";
                const gbpPerNightValue =
                  displayIncomeGbp !== null && computedNights
                    ? formatMoney(displayIncomeGbp / computedNights)
                    : booking.gbpPerNight ?? "";
                const aadeDateValue =
                  booking.dateRegisteredWithAade ?? getNextAadeDate(booking.to) ?? "";
                return (
                  <div key={`booking-${index}`}>
                    {showBookingGapsById[property.id] && sortedIndex > 0 ? (
                      <div
                        className={`admin-booking-gap${
                          gapDays === 0
                            ? " admin-booking-gap-critical"
                            : gapDays !== null && gapDays < 7
                              ? " admin-booking-gap-warning"
                              : " admin-booking-gap-ok"
                        }`}
                      >
                        {gapDays === 0 ? (
                          t("admin.bookings.singleDayChangeover")
                        ) : gapDays !== null && gapStartDate && gapEndDate ? (
                          <>
                            <span className="admin-booking-gap-date">
                              {formatDateValue(gapStartDate)}
                            </span>
                            <span className="admin-booking-gap-days">
                              {t("admin.bookings.gapDays")
                                .replace("{count}", String(gapDays))
                                .replace("{unit}", gapDays === 1 ? t("admin.bookings.day") : t("admin.bookings.days"))}
                            </span>
                            <span className="admin-booking-gap-date">
                              {formatDateValue(gapEndDate)}
                            </span>
                          </>
                        ) : (
                          t("admin.bookings.gapMissing")
                        )}
                      </div>
                    ) : null}
                    <div className="admin-nested-card">
                    <div className="admin-list-header admin-booking-header">
                      <div className="admin-booking-summary">
                        <h6>
                          {booking.names ??
                            t("admin.bookings.bookingNumber").replace("{index}", String(index + 1))}
                        </h6>
                        <span className="muted">
                          {(booking.from ?? t("admin.bookings.fromUnknown"))} →{" "}
                          {(booking.to ?? t("admin.bookings.toUnknown"))}
                        </span>
                      </div>
                      {!isExpanded && (booking.vipGuest ?? "").toLowerCase() === "yes" ? (
                        <span className="admin-booking-vip">{t("admin.bookings.vipTag")}</span>
                      ) : null}
                      {sameDayClean ? (
                        <span className="admin-booking-warning">{t("admin.bookings.sameDayClean")}</span>
                      ) : null}
                      <div className="admin-button-row">
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={!guestLink}
                          title={
                            guestLink
                              ? t("admin.bookings.copyGuestLink")
                              : t("admin.bookings.guestLinkMissing")
                          }
                          onClick={async () => {
                            if (!guestLink) {
                              return;
                            }
                            try {
                              await navigator.clipboard.writeText(guestLink);
                              setToastMessage(t("admin.bookings.guestLinkCopied"));
                            } catch {
                              window.prompt(t("admin.bookings.guestLinkPrompt"), guestLink);
                              setToastMessage(t("admin.bookings.guestLinkCopied"));
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faLink} /><span>{t("admin.bookings.copyGuestLink")}</span>
                        </button>
                        <button
                          type="button"
                          className="admin-secondary"
                          onClick={() =>
                            setExpandedBookingsByKey((prev) => ({
                              ...prev,
                              [bookingKey]: !isExpanded
                            }))
                          }
                        >
                          {isExpanded ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}<span>{isExpanded ? t("admin.actions.hide") : t("admin.actions.show")}</span>
                        </button>
                        {!isReadOnly ? (
                          <button
                            type="button"
                            className="admin-danger"
                            onClick={() =>
                              updateDraft(property.id, (current) =>
                                updateFirstRentalUnit(current, (unit) => ({
                                  ...unit,
                                  bookings: (unit.bookings ?? []).filter(
                                    (_item, itemIndex) => itemIndex !== index
                                  )
                                }))
                              )
                            }
                          >
                            <FontAwesomeIcon icon={faTrash} /><span>{t("admin.bookings.remove")}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {isExpanded ? (
                      <fieldset className="admin-form admin-booking-details" disabled={isReadOnly}>
                        <div className="admin-form admin-form-inline admin-booking-row">
                          <label className="admin-field">
                            <span>{t("admin.bookings.from")}</span>
                            <input
                              className="admin-input-date"
                              value={booking.from ?? ""}
                              onChange={(event) => {
                                const nextFrom = event.target.value;
                                const nextNights = calculateNights(nextFrom, booking.to);
                                const nextAade = booking.dateRegisteredWithAade
                                  ? booking.dateRegisteredWithAade
                                  : getNextAadeDate(booking.to);
                                const nextIncomeGbp =
                                  incomeEurValue !== null ? incomeEurValue * exchangeRateValue : null;
                                updateBooking(property.id, index, {
                                  from: nextFrom,
                                  nights: nextNights !== null ? `${nextNights}` : "",
                                  eurPerNight:
                                    incomeEurValue !== null && nextNights
                                      ? formatMoney(incomeEurValue / nextNights)
                                      : "",
                                  gbpPerNight:
                                    nextIncomeGbp !== null && nextNights
                                      ? formatMoney(nextIncomeGbp / nextNights)
                                      : "",
                                  incomeGbp: nextIncomeGbp !== null ? formatMoney(nextIncomeGbp) : "",
                                  dateRegisteredWithAade: nextAade || undefined
                                });
                              }}
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.to")}</span>
                            <input
                              className="admin-input-date"
                              value={booking.to ?? ""}
                              onChange={(event) => {
                                const nextTo = event.target.value;
                                const nextNights = calculateNights(booking.from, nextTo);
                                const nextAade = booking.dateRegisteredWithAade
                                  ? booking.dateRegisteredWithAade
                                  : getNextAadeDate(nextTo);
                                const nextIncomeGbp =
                                  incomeEurValue !== null ? incomeEurValue * exchangeRateValue : null;
                                updateBooking(property.id, index, {
                                  to: nextTo,
                                  nights: nextNights !== null ? `${nextNights}` : "",
                                  eurPerNight:
                                    incomeEurValue !== null && nextNights
                                      ? formatMoney(incomeEurValue / nextNights)
                                      : "",
                                  gbpPerNight:
                                    nextIncomeGbp !== null && nextNights
                                      ? formatMoney(nextIncomeGbp / nextNights)
                                      : "",
                                  incomeGbp: nextIncomeGbp !== null ? formatMoney(nextIncomeGbp) : "",
                                  dateRegisteredWithAade: nextAade || undefined
                                });
                              }}
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.nights")}</span>
                            <input className="admin-input-short" readOnly value={nightsValue} />
                          </label>
                        </div>
                        <div className="admin-form admin-form-inline admin-booking-row">
                          <label className="admin-field">
                            <span>{t("admin.bookings.names")}</span>
                            <input
                              className="admin-input-name"
                              value={booking.names ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, { names: event.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.bookingId")}</span>
                            <input
                              value={booking.bookingId ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, { bookingId: event.target.value })
                              }
                            />
                          </label>
                          <div className="admin-field">
                            <span>{t("admin.bookings.preferredLanguage")}</span>
                            <AdminSelect
                              value={booking.preferredLanguage ?? ""}
                              options={listingOptions.map((option) => ({
                                value: option.code,
                                label: option.label
                              }))}
                              onChange={(value) =>
                                updateBooking(property.id, index, { preferredLanguage: value || null })
                              }
                            />
                          </div>
                          <div className="admin-field">
                            <span>{t("admin.bookings.source")}</span>
                            <AdminSelect
                              value={booking.source ?? ""}
                              options={bookingSourceOptions}
                              onChange={(value) =>
                                updateBooking(property.id, index, { source: value })
                              }
                            />
                          </div>
                          <label
                            className={`admin-field admin-checkbox${
                              (booking.vipGuest ?? "").toLowerCase() === "yes" ? " vip-checked" : ""
                            }`}
                          >
                            <span>{t("admin.bookings.vipGuest")}</span>
                            <input
                              type="checkbox"
                              checked={(booking.vipGuest ?? "").toLowerCase() === "yes"}
                              onChange={(event) =>
                                updateBooking(property.id, index, {
                                  vipGuest: event.target.checked ? "Yes" : "No"
                                })
                              }
                            />
                          </label>
                          <label className="admin-field admin-checkbox admin-booking-row">
                            <span>{t("admin.bookings.repeatVisit")}</span>
                            <input
                              type="checkbox"
                              checked={(booking.repeatVisit ?? "").toLowerCase() === "yes"}
                              onChange={(event) =>
                                updateBooking(property.id, index, {
                                  repeatVisit: event.target.checked ? "Yes" : "No"
                                })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.dateOfBooking")}</span>
                            <input
                              className="admin-input-date"
                              value={booking.dateOfBooking ?? ""}
                              onChange={(event) => {
                                const nextDate = event.target.value;
                                const shouldUpdateRate = !toNumber(booking.exchangeRateEurGbp);
                                const nextRate = shouldUpdateRate
                                  ? getEurGbpRate(parseDateValue(nextDate))
                                  : exchangeRateValue;
                                const nextIncomeGbp =
                                  incomeEurValue !== null ? incomeEurValue * nextRate : null;
                                updateBooking(property.id, index, {
                                  dateOfBooking: nextDate,
                                  exchangeRateEurGbp: shouldUpdateRate
                                    ? formatMoney(nextRate)
                                    : booking.exchangeRateEurGbp ?? "",
                                  incomeGbp: nextIncomeGbp !== null ? formatMoney(nextIncomeGbp) : "",
                                  gbpPerNight:
                                    nextIncomeGbp !== null && computedNights
                                      ? formatMoney(nextIncomeGbp / computedNights)
                                      : ""
                                });
                              }}
                            />
                          </label>
                        </div>
                        {isAirbnbSource ? (
                          <div className="admin-form admin-form-inline admin-booking-row">
                            <label className="admin-field">
                              <span>{t("admin.bookings.identificationType")}</span>
                              <input
                                value={booking.identificationType ?? ""}
                                onChange={(event) =>
                                  updateBooking(property.id, index, {
                                    identificationType: event.target.value
                                  })
                                }
                              />
                            </label>
                            <label className="admin-field">
                              <span>{t("admin.bookings.identificationNumber")}</span>
                              <input
                                value={booking.identificationNumber ?? ""}
                                onChange={(event) =>
                                  updateBooking(property.id, index, {
                                    identificationNumber: event.target.value
                                  })
                                }
                              />
                            </label>
                          </div>
                        ) : null}
                        <div className="admin-form admin-form-inline admin-booking-row">
                          <label className="admin-field">
                            <span>{t("admin.bookings.arrivalAirport")}</span>
                            <input
                              className="admin-input-name"
                              value={booking.airport ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, { airport: event.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.flightNumber")}</span>
                            <div className="admin-input-group">
                              <input
                                value={booking.flightNumber ?? ""}
                                onChange={(event) =>
                                  updateBooking(property.id, index, {
                                    flightNumber: event.target.value
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="admin-secondary admin-lookup-button"
                                disabled={
                                  !canEditProperties
                                  || !booking.flightNumber
                                  || flightLookupState?.loading
                                }
                                onClick={async () => {
                                  if (!token || !booking.flightNumber) {
                                    return;
                                  }
                                  setFlightLookupByKey((prev) => ({
                                    ...prev,
                                    [bookingKey]: { loading: true }
                                  }));
                                  try {
                                    const response = await lookupFlightArrival(token, {
                                      flightNumber: booking.flightNumber,
                                      date: booking.from ?? null,
                                      airport: booking.airport ?? null
                                    });
                                    if (response.arrivalTime) {
                                      updateBooking(property.id, index, {
                                        arrivalTime: response.arrivalTime
                                      });
                                    } else {
                                      setFlightLookupByKey((prev) => ({
                                        ...prev,
                                        [bookingKey]: {
                                          loading: false,
                                        error: t("admin.bookings.flightArrivalNotFound")
                                        }
                                      }));
                                      return;
                                    }
                                    setFlightLookupByKey((prev) => ({
                                      ...prev,
                                      [bookingKey]: { loading: false }
                                    }));
                                  } catch (err) {
                                    setFlightLookupByKey((prev) => ({
                                      ...prev,
                                      [bookingKey]: {
                                        loading: false,
                                        error:
                                          err instanceof Error
                                            ? err.message
                                        : t("admin.bookings.flightArrivalLookupError")
                                      }
                                    }));
                                  }
                                }}
                              >
                                {flightLookupState?.loading ? (
                                  <>
                                <FontAwesomeIcon icon={faSpinner} spin /><span>{t("admin.bookings.lookup")}</span>
                                  </>
                                ) : (
                                  <FontAwesomeIcon icon={faPlane} />
                                )}
                              </button>
                            </div>
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.flightArrival")}</span>
                            <input
                              className="admin-input-time"
                              placeholder={t("admin.bookings.flightArrivalPlaceholder")}
                              value={booking.arrivalTime ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, { arrivalTime: event.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field admin-checkbox">
                            <span>{t("admin.bookings.hasArrived")}</span>
                            <input
                              type="checkbox"
                              checked={(booking.hasArrived ?? "").toLowerCase() === "yes"}
                              onChange={(event) =>
                                updateBooking(property.id, index, {
                                  hasArrived: event.target.checked ? "Yes" : "No"
                                })
                              }
                            />
                          </label>
                        </div>
                        {flightLookupState?.error ? (
                          <p className="admin-flight-error">{flightLookupState.error}</p>
                        ) : null}
                        <div className="admin-form admin-form-inline admin-booking-row">
                          <label className="admin-field">
                            <span>{t("admin.bookings.adults")}</span>
                            <input
                              className="admin-input-short"
                              value={booking.adults ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, { adults: event.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.children")}</span>
                            <input
                              className="admin-input-short"
                              value={booking.children ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, { children: event.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.bookings.childrenAges")}</span>
                            <input
                            className="admin-input-name"
                              value={booking.childrenAges ?? ""}
                              onChange={(event) =>
                                updateBooking(property.id, index, {
                                  childrenAges: event.target.value
                                })
                              }
                            />
                          </label>
                          <label className="admin-field admin-checkbox">
                            <span>{t("admin.bookings.cotRequired")}</span>
                            <input
                              type="checkbox"
                              checked={(booking.cotRequired ?? "").toLowerCase() === "yes"}
                              onChange={(event) =>
                                updateBooking(property.id, index, {
                                  cotRequired: event.target.checked ? "Yes" : "No"
                                })
                              }
                            />
                          </label>
                        </div>
                        {canViewFinancials ? (
                          <div className="admin-form admin-form-inline admin-booking-row">
                            <label className="admin-field">
                              <span>{t("admin.bookings.incomeEur")}</span>
                              <input
                                value={displayIncomeEur !== null ? formatMoney(displayIncomeEur) : ""}
                                onChange={(event) => {
                                  const nextIncomeEur = event.target.value;
                                  const nextIncomeEurValue = toNumber(nextIncomeEur);
                                  const nextIncomeGbp =
                                    nextIncomeEurValue !== null
                                      ? nextIncomeEurValue * exchangeRateValue
                                      : null;
                                  updateBooking(property.id, index, {
                                    incomeEur: nextIncomeEur,
                                    incomeGbp: nextIncomeGbp !== null ? formatMoney(nextIncomeGbp) : "",
                                    eurPerNight:
                                      nextIncomeEurValue !== null && computedNights
                                        ? formatMoney(nextIncomeEurValue / computedNights)
                                        : "",
                                    gbpPerNight:
                                      nextIncomeGbp !== null && computedNights
                                        ? formatMoney(nextIncomeGbp / computedNights)
                                        : ""
                                  });
                                }}
                              />
                            </label>
                            <label className="admin-field">
                              <span>{t("admin.bookings.eurPerNight")}</span>
                              <input readOnly value={eurPerNightValue} />
                            </label>
                            <label className="admin-field">
                              <span>{t("admin.bookings.incomeGbp")}</span>
                              <input
                                value={displayIncomeGbp !== null ? formatMoney(displayIncomeGbp) : ""}
                                onChange={(event) => {
                                  const nextIncomeGbp = event.target.value;
                                  const nextIncomeGbpValue = toNumber(nextIncomeGbp);
                                  const nextIncomeEur =
                                    nextIncomeGbpValue !== null
                                      ? nextIncomeGbpValue / exchangeRateValue
                                      : null;
                                  updateBooking(property.id, index, {
                                    incomeGbp: nextIncomeGbp,
                                    incomeEur: nextIncomeEur !== null ? formatMoney(nextIncomeEur) : "",
                                    eurPerNight:
                                      nextIncomeEur !== null && computedNights
                                        ? formatMoney(nextIncomeEur / computedNights)
                                        : "",
                                    gbpPerNight:
                                      nextIncomeGbpValue !== null && computedNights
                                        ? formatMoney(nextIncomeGbpValue / computedNights)
                                        : ""
                                  });
                                }}
                              />
                            </label>
                            <label className="admin-field">
                              <span>{t("admin.bookings.gbpPerNight")}</span>
                              <input readOnly value={gbpPerNightValue} />
                            </label>
                            <label className="admin-field">
                              <span>{t("admin.bookings.exchangeRate")}</span>
                              <input
                                className="admin-input-rate"
                                value={formatMoney(exchangeRateValue)}
                                onChange={(event) => {
                                  const nextRateValue = toNumber(event.target.value);
                                  if (!nextRateValue || !Number.isFinite(nextRateValue)) {
                                    updateBooking(property.id, index, {
                                      exchangeRateEurGbp: event.target.value
                                    });
                                    return;
                                  }
                                  const nextIncomeGbp =
                                    incomeEurValue !== null ? incomeEurValue * nextRateValue : null;
                                  const nextIncomeEur =
                                    incomeGbpValue !== null ? incomeGbpValue / nextRateValue : null;
                                  const resolvedIncomeEur =
                                    incomeEurValue ?? nextIncomeEur ?? null;
                                  const resolvedIncomeGbp =
                                    incomeGbpValue ?? nextIncomeGbp ?? null;
                                  updateBooking(property.id, index, {
                                    exchangeRateEurGbp: formatMoney(nextRateValue),
                                    incomeEur:
                                      resolvedIncomeEur !== null ? formatMoney(resolvedIncomeEur) : "",
                                    incomeGbp:
                                      resolvedIncomeGbp !== null ? formatMoney(resolvedIncomeGbp) : "",
                                    eurPerNight:
                                      resolvedIncomeEur !== null && computedNights
                                        ? formatMoney(resolvedIncomeEur / computedNights)
                                        : "",
                                    gbpPerNight:
                                      resolvedIncomeGbp !== null && computedNights
                                        ? formatMoney(resolvedIncomeGbp / computedNights)
                                        : ""
                                  });
                                }}
                              />
                            </label>
                          </div>
                        ) : null}
                        <div className="admin-form admin-form-inline admin-booking-row">
                          <label className="admin-field">
                            <span>{t("admin.bookings.cleanDate")}</span>
                            <input
                              className="admin-input-date-range"
                              readOnly
                              value={cleanDateValue}
                            />
                          </label>
                          {isAirbnbSource ? (
                            <>
                              <label className="admin-field">
                                <span>{t("admin.bookings.aadeRegisteredDate")}</span>
                                <input
                                  className="admin-input-date"
                                  value={aadeDateValue}
                                  onChange={(event) =>
                                    updateBooking(property.id, index, {
                                      dateRegisteredWithAade: event.target.value
                                    })
                                  }
                                />
                              </label>
                              <label className="admin-field">
                                <span>{t("admin.bookings.aadeScreenshot")}</span>
                                <input
                                  value={booking.aadeScreenshot ?? ""}
                                  onChange={(event) =>
                                    updateBooking(property.id, index, {
                                      aadeScreenshot: event.target.value
                                    })
                                  }
                                />
                              </label>
                            </>
                          ) : null}
                        </div>
                        <label className="admin-field">
                          <span>{t("admin.bookings.comments")}</span>
                          <textarea
                            value={booking.comments ?? ""}
                            rows={3}
                            onChange={(event) =>
                              updateBooking(property.id, index, { comments: event.target.value })
                            }
                          />
                        </label>
                      </fieldset>
                    ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )
    }

    if (activeTab === "guestInfo") {
      const guestInfo = draft.guestInfo ?? {
        wifiNetworkName: null,
        wifiPassword: null,
        wifiNotes: null,
        equipmentInstructions: [],
        healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
      };
      const equipment = guestInfo.equipmentInstructions ?? [];
      const pdfs = draft.pdfs ?? [];
      const health = guestInfo.healthAndSafety ?? {
        emergencyContacts: [],
        safetyAdviceItems: []
      };
      const contacts = health.emergencyContacts ?? [];
      const safetyItems = health.safetyAdviceItems ?? [];
      const emergencyContactCategories = [
        { value: "Emergency Services", label: t("admin.guestInfo.categoryEmergencyServices") },
        { value: "Medical Centres", label: t("admin.guestInfo.categoryMedicalCentres") },
        { value: "Pharmacies", label: t("admin.guestInfo.categoryPharmacies") }
      ];
      const emergencyKey = getGuestEmergencyKey(property.id);
      const safetyKey = getGuestSafetyKey(property.id);
      const activeContactIndex = Math.min(
        Math.max(activeGuestEmergencyContactIndexByKey[emergencyKey] ?? 0, 0),
        Math.max(contacts.length - 1, 0)
      );
      const activeSafetyIndex = Math.min(
        Math.max(activeGuestSafetyAdviceIndexByKey[safetyKey] ?? 0, 0),
        Math.max(safetyItems.length - 1, 0)
      );
      const getReadableTextColor = (hex?: string) => {
        const raw = hex?.trim() ?? "";
        if (!raw.startsWith("#")) return undefined;
        const expanded =
          raw.length === 4
            ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
            : raw;
        if (expanded.length !== 7) return undefined;
        const r = Number.parseInt(expanded.slice(1, 3), 16);
        const g = Number.parseInt(expanded.slice(3, 5), 16);
        const b = Number.parseInt(expanded.slice(5, 7), 16);
        if ([r, g, b].some((c) => Number.isNaN(c))) return undefined;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6 ? "#1f2937" : "#ffffff";
      };
      return (
        <div className="admin-tab-page">
          <h2>{t("admin.guestInfo.title")}</h2>
          <p className="muted">{t("admin.guestInfo.subtitle")}</p>
          <div className="admin-nested-card">
            <h4>{t("admin.guestInfo.wifiTitle")}</h4>
            <label className="admin-field">
              <span>{t("admin.guestInfo.wifiNetworkName")}</span>
              <input
                type="text"
                value={guestInfo.wifiNetworkName ?? ""}
                onChange={(event) =>
                  updateDraft(property.id, (current) => ({
                    ...current,
                    guestInfo: {
                      ...(current.guestInfo ?? {
                        wifiNetworkName: null,
                        wifiPassword: null,
                        wifiNotes: null,
                        equipmentInstructions: [],
                        healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                      }),
                      wifiNetworkName: event.target.value || null
                    }
                  }))
                }
              />
            </label>
            <label className="admin-field">
              <span>{t("admin.guestInfo.wifiPassword")}</span>
              <input
                type="text"
                value={guestInfo.wifiPassword ?? ""}
                onChange={(event) =>
                  updateDraft(property.id, (current) => ({
                    ...current,
                    guestInfo: {
                      ...(current.guestInfo ?? {
                        wifiNetworkName: null,
                        wifiPassword: null,
                        wifiNotes: null,
                        equipmentInstructions: [],
                        healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                      }),
                      wifiPassword: event.target.value || null
                    }
                  }))
                }
              />
            </label>
            <LocalizedTextField
              languageOptions={listingOptions}
              label={t("admin.guestInfo.wifiNotesLabel")}
              value={guestInfo.wifiNotes}
              multiline
              rows={2}
              onChange={(nextValue) =>
                updateDraft(property.id, (current) => ({
                  ...current,
                  guestInfo: {
                    ...(current.guestInfo ?? {
                      wifiNetworkName: null,
                      wifiPassword: null,
                      wifiNotes: null,
                      equipmentInstructions: [],
                      healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                    }),
                    wifiNotes: nextValue
                  }
                }))
              }
            />
          </div>
          <div className="admin-nested-card">
            <h4>{t("admin.guestInfo.equipmentTitle")}</h4>
            <div className="admin-list">
              <div className="admin-list-header">
                <h5>{t("admin.guestInfo.equipmentItems")}</h5>
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() =>
                    updateDraft(property.id, (current) => {
                      const prev = current.guestInfo ?? {
                        wifiNetworkName: null,
                        wifiPassword: null,
                        wifiNotes: null,
                        equipmentInstructions: [],
                        healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                      };
                      const nextList = [...(prev.equipmentInstructions ?? []), {
                        id: `equip-${Date.now()}`,
                        name: "",
                        instructions: null,
                        pdfId: null
                      }];
                      return {
                        ...current,
                        guestInfo: { ...prev, equipmentInstructions: nextList }
                      };
                    })
                  }
                >
                  <FontAwesomeIcon icon={faPlus} /><span>{t("admin.guestInfo.addEquipment")}</span>
                </button>
              </div>
              {equipment.length === 0 ? (
                <p className="muted">{t("admin.guestInfo.noEquipment")}</p>
              ) : (
                equipment.map((item, index) => (
                  <div key={item.id} className="admin-nested-card admin-guest-equipment-item">
                    <div className="admin-inline-row">
                      <input
                        className="admin-input-name"
                        placeholder={t("admin.guestInfo.equipmentNamePlaceholder")}
                        value={resolveLocalizedText(item.name, language)}
                        onChange={(event) =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const nextList = (prev.equipmentInstructions ?? []).map((eq, i) =>
                              i === index ? { ...eq, name: event.target.value } : eq
                            );
                            return {
                              ...current,
                              guestInfo: { ...prev, equipmentInstructions: nextList }
                            };
                          })
                        }
                      />
                      <AdminSelect
                        value={item.pdfId ?? ""}
                        options={[
                          { value: "", label: t("admin.guestInfo.noPdf") },
                          ...pdfs.map((pdf) => ({
                            value: pdf.id,
                            label: resolveLocalizedText(pdf.title, language)
                          }))
                        ]}
                        onChange={(nextValue) =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const nextList = (prev.equipmentInstructions ?? []).map((eq, i) =>
                              i === index ? { ...eq, pdfId: nextValue || null } : eq
                            );
                            return {
                              ...current,
                              guestInfo: { ...prev, equipmentInstructions: nextList }
                            };
                          })
                        }
                      />
                      <button
                        type="button"
                        className="admin-danger fit-content"
                        onClick={() =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const nextList = (prev.equipmentInstructions ?? []).filter(
                              (_eq, i) => i !== index
                            );
                            return {
                              ...current,
                              guestInfo: { ...prev, equipmentInstructions: nextList }
                            };
                          })
                        }
                      >
                        <FontAwesomeIcon icon={faTrash} /><span>{t("admin.actions.removeItem")}</span>
                      </button>
                    </div>
                    <LocalizedTextField
                      languageOptions={listingOptions}
                      label={t("admin.guestInfo.equipmentInstructionsLabel")}
                      value={item.instructions}
                      multiline
                      rows={4}
                      onChange={(nextValue) =>
                        updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const nextList = (prev.equipmentInstructions ?? []).map((eq, i) =>
                              i === index ? { ...eq, instructions: nextValue } : eq
                            );
                          return {
                            ...current,
                            guestInfo: { ...prev, equipmentInstructions: nextList }
                          };
                        })
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="admin-nested-card">
            <h4>{t("admin.guestInfo.healthAndSafetyTitle")}</h4>
            <div className="admin-list">
              <div className="admin-list-header">
                <h5>{t("admin.guestInfo.emergencyContactsTitle")}</h5>
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    updateDraft(property.id, (current) => {
                      const prev = current.guestInfo ?? {
                        wifiNetworkName: null,
                        wifiPassword: null,
                        wifiNotes: null,
                        equipmentInstructions: [],
                        healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                      };
                      const healthPrev = prev.healthAndSafety ?? {
                        emergencyContacts: [],
                        safetyAdviceItems: []
                      };
                      const nextContacts = [
                        ...(healthPrev.emergencyContacts ?? []),
                        {
                          category: "Emergency Services",
                          name: null,
                          phone: null,
                          notes: null,
                          images: [],
                          mapReference: null,
                          links: [],
                          distance: null
                        }
                      ];
                      return {
                        ...current,
                        guestInfo: {
                          ...prev,
                          healthAndSafety: { ...healthPrev, emergencyContacts: nextContacts }
                        }
                      };
                    });
                    const nextLen = (health.emergencyContacts ?? []).length + 1;
                    setActiveGuestEmergencyContactIndexByKey((prev) => ({
                      ...prev,
                      [emergencyKey]: nextLen - 1
                    }));
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t("admin.guestInfo.addEmergencyContact")}</span>
                </button>
              </div>
              {contacts.length === 0 ? (
                <p className="muted">{t("admin.guestInfo.noEmergencyContacts")}</p>
              ) : (
                <>
                  <div className="admin-tabs">
                    {contacts.map((contact, cIndex) => {
                      const meta =
                        guestEmergencyCategoryMeta[contact.category || "Emergency Services"] ?? {};
                      const label =
                        resolveLocalizedText(contact.name, language)?.trim() ||
                        t("admin.guestInfo.contactUnnamed");
                      return (
                        <button
                          key={`emergency-tag-${cIndex}`}
                          type="button"
                          className={`admin-tab${cIndex === activeContactIndex ? " active" : ""}`}
                          style={
                            meta.color
                              ? {
                                  backgroundColor: meta.color,
                                  borderColor: meta.color,
                                  color: getReadableTextColor(meta.color)
                                }
                              : undefined
                          }
                          onClick={() =>
                            setActiveGuestEmergencyContactIndexByKey((prev) => ({
                              ...prev,
                              [emergencyKey]: cIndex
                            }))
                          }
                        >
                          {meta.icon ? (
                            <span className="admin-tab-icon">
                              <i className={getIconClassName(meta.icon)} />
                            </span>
                          ) : null}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {contacts.map((contact, cIndex) =>
                    cIndex === activeContactIndex ? (
                      <div
                        key={`contact-${cIndex}`}
                        className="admin-nested-card admin-guest-emergency-contact"
                      >
                        <div className="admin-inline-row">
                          <AdminSelect
                            value={contact.category || "Emergency Services"}
                        options={emergencyContactCategories}
                        onChange={(nextValue) =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const healthPrev = prev.healthAndSafety ?? {
                              emergencyContacts: [],
                              safetyAdviceItems: []
                            };
                            const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                              i === cIndex ? { ...c, category: nextValue } : c
                            );
                            return {
                              ...current,
                              guestInfo: {
                                ...prev,
                                healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                              }
                            };
                          })
                        }
                      />
                      <input
                        type="text"
                        className="admin-input-name"
                        placeholder={t("admin.guestInfo.contactNamePlaceholder")}
                        value={resolveLocalizedText(contact.name, language)}
                        onChange={(event) =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const healthPrev = prev.healthAndSafety ?? {
                              emergencyContacts: [],
                              safetyAdviceItems: []
                            };
                            const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                              i === cIndex ? { ...c, name: event.target.value } : c
                            );
                            return {
                              ...current,
                              guestInfo: {
                                ...prev,
                                healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                              }
                            };
                          })
                        }
                      />
                      <input
                        type="text"
                        className="admin-input-phone"
                        placeholder={t("admin.guestInfo.contactPhonePlaceholder")}
                        value={contact.phone ?? ""}
                        onChange={(event) =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const healthPrev = prev.healthAndSafety ?? {
                              emergencyContacts: [],
                              safetyAdviceItems: []
                            };
                            const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                              i === cIndex ? { ...c, phone: event.target.value || null } : c
                            );
                            return {
                              ...current,
                              guestInfo: {
                                ...prev,
                                healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                              }
                            };
                          })
                        }
                      />
                      <label className="admin-field admin-input-distance">
                        <span>{t("admin.experiences.distance")}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={
                            (contact as { distance?: number | null; Distance?: number | null })
                              .distance ??
                            (contact as { distance?: number | null; Distance?: number | null })
                              .Distance ??
                            ""
                          }
                          placeholder={t("admin.experiences.distancePlaceholder")}
                          onChange={(event) => {
                            const raw = event.target.value.trim();
                            const nextValue =
                              raw === "" ? null : Number(raw);
                            updateDraft(property.id, (current) => {
                              const prev = current.guestInfo ?? {
                                wifiNetworkName: null,
                                wifiPassword: null,
                                wifiNotes: null,
                                equipmentInstructions: [],
                                healthAndSafety: {
                                  emergencyContacts: [],
                                  safetyAdviceItems: []
                                }
                              };
                              const healthPrev = prev.healthAndSafety ?? {
                                emergencyContacts: [],
                                safetyAdviceItems: []
                              };
                              const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                                i === cIndex
                                  ? {
                                      ...c,
                                      distance:
                                        nextValue === null ||
                                        Number.isNaN(nextValue)
                                          ? null
                                          : nextValue
                                    }
                                  : c
                              );
                              return {
                                ...current,
                                guestInfo: {
                                  ...prev,
                                  healthAndSafety: {
                                    ...healthPrev,
                                    emergencyContacts: nextList
                                  }
                                }
                              };
                            });
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-danger fit-content"
                        onClick={() => {
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const healthPrev = prev.healthAndSafety ?? {
                              emergencyContacts: [],
                              safetyAdviceItems: []
                            };
                            const nextList = (healthPrev.emergencyContacts ?? []).filter(
                              (_c, i) => i !== cIndex
                            );
                            return {
                              ...current,
                              guestInfo: {
                                ...prev,
                                healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                              }
                            };
                          });
                          setActiveGuestEmergencyContactIndexByKey((prev) => ({
                            ...prev,
                            [emergencyKey]: Math.max(0, Math.min(activeContactIndex, contacts.length - 2))
                          }));
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    <LocalizedTextField
                      languageOptions={listingOptions}
                      label={t("admin.guestInfo.contactNotesLabel")}
                      value={contact.notes}
                      multiline
                      rows={2}
                      onChange={(nextValue) =>
                        updateDraft(property.id, (current) => {
                          const prev = current.guestInfo ?? {
                            wifiNetworkName: null,
                            wifiPassword: null,
                            wifiNotes: null,
                            equipmentInstructions: [],
                            healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                          };
                          const healthPrev = prev.healthAndSafety ?? {
                            emergencyContacts: [],
                            safetyAdviceItems: []
                          };
                          const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                            i === cIndex ? { ...c, notes: nextValue } : c
                          );
                          return {
                            ...current,
                            guestInfo: {
                              ...prev,
                              healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                            }
                          };
                        })
                      }
                    />
                    <div className="admin-list">
                      <div className="admin-list-header">
                        <h5>{t("admin.guestInfo.contactImagesTitle")}</h5>
                        <button
                          type="button"
                          className="admin-secondary"
                          onClick={() =>
                            updateDraft(property.id, (current) => {
                              const prev = current.guestInfo ?? {
                                wifiNetworkName: null,
                                wifiPassword: null,
                                wifiNotes: null,
                                equipmentInstructions: [],
                                healthAndSafety: {
                                  emergencyContacts: [],
                                  safetyAdviceItems: []
                                }
                              };
                              const healthPrev = prev.healthAndSafety ?? {
                                emergencyContacts: [],
                                safetyAdviceItems: []
                              };
                              const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                                i === cIndex
                                  ? {
                                      ...c,
                                      images: [...(c.images ?? []), { src: "", alt: null }]
                                    }
                                  : c
                              );
                              return {
                                ...current,
                                guestInfo: {
                                  ...prev,
                                  healthAndSafety: {
                                    ...healthPrev,
                                    emergencyContacts: nextList
                                  }
                                }
                              };
                            })
                          }
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          <span>{t("admin.actions.addImage")}</span>
                        </button>
                      </div>
                      {((contact.images ?? []).length === 0 ? (
                        <p className="muted">{t("admin.hero.none")}</p>
                      ) : (
                        <div className="admin-image-grid">
                          {(contact.images ?? []).map((image, imgIndex) => (
                            <div key={imgIndex} className="admin-image-tile">
                              <div className="admin-image-thumb">
                                {image.src ? (
                                  <img
                                    src={resolveImageUrl(property.id, image.src)}
                                    alt={resolveLocalizedText(
                                      image.alt ?? getImageFilename(image.src),
                                      language
                                    )}
                                  />
                                ) : (
                                  <span className="admin-image-placeholder">
                                    {t("admin.images.none")}
                                  </span>
                                )}
                              </div>
                              <input
                                className="admin-image-input"
                                value={image.src}
                                placeholder={t("admin.images.path")}
                                onChange={(event) =>
                                  updateDraft(property.id, (current) => {
                                    const prev = current.guestInfo ?? {
                                      wifiNetworkName: null,
                                      wifiPassword: null,
                                      wifiNotes: null,
                                      equipmentInstructions: [],
                                      healthAndSafety: {
                                        emergencyContacts: [],
                                        safetyAdviceItems: []
                                      }
                                    };
                                    const healthPrev = prev.healthAndSafety ?? {
                                      emergencyContacts: [],
                                      safetyAdviceItems: []
                                    };
                                    const nextList = (
                                      healthPrev.emergencyContacts ?? []
                                    ).map((c, i) =>
                                      i === cIndex
                                        ? {
                                            ...c,
                                            images: (c.images ?? []).map((img, ii) =>
                                              ii === imgIndex
                                                ? { ...img, src: event.target.value }
                                                : img
                                            )
                                          }
                                        : c
                                    );
                                    return {
                                      ...current,
                                      guestInfo: {
                                        ...prev,
                                        healthAndSafety: {
                                          ...healthPrev,
                                          emergencyContacts: nextList
                                        }
                                      }
                                    };
                                  })
                                }
                              />
                              <LocalizedTextField
                                languageOptions={listingOptions}
                                className="admin-image-caption"
                                label={t("admin.images.caption")}
                                value={image.alt}
                                placeholder={t("admin.images.caption")}
                                onChange={(nextValue) =>
                                  updateDraft(property.id, (current) => {
                                    const prev = current.guestInfo ?? {
                                      wifiNetworkName: null,
                                      wifiPassword: null,
                                      wifiNotes: null,
                                      equipmentInstructions: [],
                                      healthAndSafety: {
                                        emergencyContacts: [],
                                        safetyAdviceItems: []
                                      }
                                    };
                                    const healthPrev = prev.healthAndSafety ?? {
                                      emergencyContacts: [],
                                      safetyAdviceItems: []
                                    };
                                    const nextList = (
                                      healthPrev.emergencyContacts ?? []
                                    ).map((c, i) =>
                                      i === cIndex
                                        ? {
                                            ...c,
                                            images: (c.images ?? []).map((img, ii) =>
                                              ii === imgIndex
                                                ? { ...img, alt: nextValue }
                                                : img
                                            )
                                          }
                                        : c
                                    );
                                    return {
                                      ...current,
                                      guestInfo: {
                                        ...prev,
                                        healthAndSafety: {
                                          ...healthPrev,
                                          emergencyContacts: nextList
                                        }
                                      }
                                    };
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="admin-image-remove"
                                aria-label={t("admin.actions.removeImage")}
                                onClick={() =>
                                  updateDraft(property.id, (current) => {
                                    const prev = current.guestInfo ?? {
                                      wifiNetworkName: null,
                                      wifiPassword: null,
                                      wifiNotes: null,
                                      equipmentInstructions: [],
                                      healthAndSafety: {
                                        emergencyContacts: [],
                                        safetyAdviceItems: []
                                      }
                                    };
                                    const healthPrev = prev.healthAndSafety ?? {
                                      emergencyContacts: [],
                                      safetyAdviceItems: []
                                    };
                                    const nextList = (
                                      healthPrev.emergencyContacts ?? []
                                    ).map((c, i) =>
                                      i === cIndex
                                        ? {
                                            ...c,
                                            images: (c.images ?? []).filter(
                                              (_img, ii) => ii !== imgIndex
                                            )
                                          }
                                        : c
                                    );
                                    return {
                                      ...current,
                                      guestInfo: {
                                        ...prev,
                                        healthAndSafety: {
                                          ...healthPrev,
                                          emergencyContacts: nextList
                                        }
                                      }
                                    };
                                  })
                                }
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <label className="admin-field">
                      <span>{t("admin.guestInfo.contactMapLabel")}</span>
                      <input
                        type="text"
                        value={contact.mapReference ?? ""}
                        placeholder={t("admin.guestInfo.contactMapPlaceholder")}
                        onChange={(event) =>
                          updateDraft(property.id, (current) => {
                            const prev = current.guestInfo ?? {
                              wifiNetworkName: null,
                              wifiPassword: null,
                              wifiNotes: null,
                              equipmentInstructions: [],
                              healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                            };
                            const healthPrev = prev.healthAndSafety ?? {
                              emergencyContacts: [],
                              safetyAdviceItems: []
                            };
                            const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                              i === cIndex
                                ? { ...c, mapReference: event.target.value || null }
                                : c
                            );
                            return {
                              ...current,
                              guestInfo: {
                                ...prev,
                                healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                              }
                            };
                          })
                        }
                      />
                    </label>
                    <div className="admin-list">
                      <div className="admin-list-header">
                        <h5>{t("admin.guestInfo.contactLinksTitle")}</h5>
                        <button
                          type="button"
                          className="admin-secondary"
                          onClick={() =>
                            updateDraft(property.id, (current) => {
                              const prev = current.guestInfo ?? {
                                wifiNetworkName: null,
                                wifiPassword: null,
                                wifiNotes: null,
                                equipmentInstructions: [],
                                healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                              };
                              const healthPrev = prev.healthAndSafety ?? {
                                emergencyContacts: [],
                                safetyAdviceItems: []
                              };
                              const nextList = (healthPrev.emergencyContacts ?? []).map((c, i) =>
                                i === cIndex
                                  ? { ...c, links: [...(c.links ?? []), { url: "", label: "" }] }
                                  : c
                              );
                              return {
                                ...current,
                                guestInfo: {
                                  ...prev,
                                  healthAndSafety: { ...healthPrev, emergencyContacts: nextList }
                                }
                              };
                            })
                          }
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          <span>{t("admin.actions.addLink")}</span>
                        </button>
                      </div>
                      {((contact.links ?? []).length === 0 ? (
                        <p className="muted">{t("admin.guestInfo.noContactLinks")}</p>
                      ) : (
                        (contact.links ?? []).map((link, linkIdx) => (
                          <div
                            key={`contact-${cIndex}-link-${linkIdx}`}
                            className="admin-nested-card admin-link-row"
                          >
                            <div className="admin-link-row-header">
                              <LocalizedTextField
                                languageOptions={listingOptions}
                                className="admin-link-field"
                                label={t("admin.fields.label")}
                                value={link.label ?? ""}
                                placeholder={t("admin.guestInfo.contactLinkLabelPlaceholder")}
                                onChange={(nextValue) =>
                                  updateDraft(property.id, (current) => {
                                    const prev = current.guestInfo ?? {
                                      wifiNetworkName: null,
                                      wifiPassword: null,
                                      wifiNotes: null,
                                      equipmentInstructions: [],
                                      healthAndSafety: {
                                        emergencyContacts: [],
                                        safetyAdviceItems: []
                                      }
                                    };
                                    const healthPrev = prev.healthAndSafety ?? {
                                      emergencyContacts: [],
                                      safetyAdviceItems: []
                                    };
                                    const nextList = (healthPrev.emergencyContacts ?? []).map(
                                      (c, i) =>
                                        i === cIndex
                                          ? {
                                              ...c,
                                              links: (c.links ?? []).map((l, li) =>
                                                li === linkIdx ? { ...l, label: nextValue } : l
                                              )
                                            }
                                          : c
                                    );
                                    return {
                                      ...current,
                                      guestInfo: {
                                        ...prev,
                                        healthAndSafety: {
                                          ...healthPrev,
                                          emergencyContacts: nextList
                                        }
                                      }
                                    };
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="admin-danger"
                                onClick={() =>
                                  updateDraft(property.id, (current) => {
                                    const prev = current.guestInfo ?? {
                                      wifiNetworkName: null,
                                      wifiPassword: null,
                                      wifiNotes: null,
                                      equipmentInstructions: [],
                                      healthAndSafety: {
                                        emergencyContacts: [],
                                        safetyAdviceItems: []
                                      }
                                    };
                                    const healthPrev = prev.healthAndSafety ?? {
                                      emergencyContacts: [],
                                      safetyAdviceItems: []
                                    };
                                    const nextList = (healthPrev.emergencyContacts ?? []).map(
                                      (c, i) =>
                                        i === cIndex
                                          ? {
                                              ...c,
                                              links: (c.links ?? []).filter(
                                                (_l, li) => li !== linkIdx
                                              )
                                            }
                                          : c
                                    );
                                    return {
                                      ...current,
                                      guestInfo: {
                                        ...prev,
                                        healthAndSafety: {
                                          ...healthPrev,
                                          emergencyContacts: nextList
                                        }
                                      }
                                    };
                                  })
                                }
                              >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>{t("admin.actions.removeLink")}</span>
                              </button>
                            </div>
                            <label className="admin-field admin-link-field">
                              <input
                                value={link.url}
                                placeholder={t("admin.fields.url")}
                                onChange={(event) =>
                                  updateDraft(property.id, (current) => {
                                    const prev = current.guestInfo ?? {
                                      wifiNetworkName: null,
                                      wifiPassword: null,
                                      wifiNotes: null,
                                      equipmentInstructions: [],
                                      healthAndSafety: {
                                        emergencyContacts: [],
                                        safetyAdviceItems: []
                                      }
                                    };
                                    const healthPrev = prev.healthAndSafety ?? {
                                      emergencyContacts: [],
                                      safetyAdviceItems: []
                                    };
                                    const nextList = (healthPrev.emergencyContacts ?? []).map(
                                      (c, i) =>
                                        i === cIndex
                                          ? {
                                              ...c,
                                              links: (c.links ?? []).map((l, li) =>
                                                li === linkIdx
                                                  ? { ...l, url: event.target.value }
                                                  : l
                                              )
                                            }
                                          : c
                                    );
                                    return {
                                      ...current,
                                      guestInfo: {
                                        ...prev,
                                        healthAndSafety: {
                                          ...healthPrev,
                                          emergencyContacts: nextList
                                        }
                                      }
                                    };
                                  })
                                }
                              />
                            </label>
                          </div>
                        ))
                      ))}
                    </div>
                  </div>
                ) : null)}
                </>
              )}
            </div>
            <div className="admin-list">
              <div className="admin-list-header">
                <h5>{t("admin.guestInfo.safetyAdviceItemsTitle")}</h5>
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    updateDraft(property.id, (current) => {
                      const prev = current.guestInfo ?? {
                        wifiNetworkName: null,
                        wifiPassword: null,
                        wifiNotes: null,
                        equipmentInstructions: [],
                        healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                      };
                      const healthPrev = prev.healthAndSafety ?? {
                        emergencyContacts: [],
                        safetyAdviceItems: []
                      };
                      const nextItems = [
                        ...(healthPrev.safetyAdviceItems ?? []),
                        { topic: null, notes: null }
                      ];
                      return {
                        ...current,
                        guestInfo: {
                          ...prev,
                          healthAndSafety: { ...healthPrev, safetyAdviceItems: nextItems }
                        }
                      };
                    });
                    const nextLen = (health.safetyAdviceItems ?? []).length + 1;
                    setActiveGuestSafetyAdviceIndexByKey((prev) => ({
                      ...prev,
                      [safetyKey]: nextLen - 1
                    }));
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t("admin.guestInfo.addSafetyAdviceItem")}</span>
                </button>
              </div>
              {safetyItems.length === 0 ? (
                <p className="muted">{t("admin.guestInfo.noSafetyAdviceItems")}</p>
              ) : (
                <>
                  <div className="admin-tabs">
                    {safetyItems.map((item, sIndex) => {
                      const topicLabel =
                        resolveLocalizedText(item.topic, language)?.trim() ||
                        t("admin.guestInfo.safetyItemUnnamed");
                      return (
                        <button
                          key={`safety-tag-${sIndex}`}
                          type="button"
                          className={`admin-tab${sIndex === activeSafetyIndex ? " active" : ""}`}
                          style={{
                            backgroundColor: guestSafetyAdviceTagStyle.color,
                            borderColor: guestSafetyAdviceTagStyle.color,
                            color: getReadableTextColor(guestSafetyAdviceTagStyle.color)
                          }}
                          onClick={() =>
                            setActiveGuestSafetyAdviceIndexByKey((prev) => ({
                              ...prev,
                              [safetyKey]: sIndex
                            }))
                          }
                        >
                          <span className="admin-tab-icon">
                            <i className={getIconClassName(guestSafetyAdviceTagStyle.icon)} />
                          </span>
                          {topicLabel}
                        </button>
                      );
                    })}
                  </div>
                  {safetyItems.map((item, sIndex) =>
                    sIndex === activeSafetyIndex ? (
                      <div
                        key={`safety-${sIndex}`}
                        className="admin-nested-card admin-guest-safety-item"
                      >
                        <LocalizedTextField
                          languageOptions={listingOptions}
                          label={t("admin.guestInfo.safetyTopicLabel")}
                          value={item.topic}
                      onChange={(nextValue) =>
                        updateDraft(property.id, (current) => {
                          const prev = current.guestInfo ?? {
                            wifiNetworkName: null,
                            wifiPassword: null,
                            wifiNotes: null,
                            equipmentInstructions: [],
                            healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                          };
                          const healthPrev = prev.healthAndSafety ?? {
                            emergencyContacts: [],
                            safetyAdviceItems: []
                          };
                          const nextList = (healthPrev.safetyAdviceItems ?? []).map((s, i) =>
                            i === sIndex ? { ...s, topic: nextValue } : s
                          );
                          return {
                            ...current,
                            guestInfo: {
                              ...prev,
                              healthAndSafety: { ...healthPrev, safetyAdviceItems: nextList }
                            }
                          };
                        })
                      }
                    />
                    <LocalizedTextField
                      languageOptions={listingOptions}
                      label={t("admin.guestInfo.safetyNotesLabel")}
                      value={item.notes}
                      multiline
                      rows={4}
                      onChange={(nextValue) =>
                        updateDraft(property.id, (current) => {
                          const prev = current.guestInfo ?? {
                            wifiNetworkName: null,
                            wifiPassword: null,
                            wifiNotes: null,
                            equipmentInstructions: [],
                            healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                          };
                          const healthPrev = prev.healthAndSafety ?? {
                            emergencyContacts: [],
                            safetyAdviceItems: []
                          };
                          const nextList = (healthPrev.safetyAdviceItems ?? []).map((s, i) =>
                            i === sIndex ? { ...s, notes: nextValue } : s
                          );
                          return {
                            ...current,
                            guestInfo: {
                              ...prev,
                              healthAndSafety: { ...healthPrev, safetyAdviceItems: nextList }
                            }
                          };
                        })
                      }
                    />
                    <button
                      type="button"
                      className="admin-danger fit-content"
                      onClick={() => {
                        updateDraft(property.id, (current) => {
                          const prev = current.guestInfo ?? {
                            wifiNetworkName: null,
                            wifiPassword: null,
                            wifiNotes: null,
                            equipmentInstructions: [],
                            healthAndSafety: { emergencyContacts: [], safetyAdviceItems: [] }
                          };
                          const healthPrev = prev.healthAndSafety ?? {
                            emergencyContacts: [],
                            safetyAdviceItems: []
                          };
                          const nextList = (healthPrev.safetyAdviceItems ?? []).filter(
                            (_s, i) => i !== sIndex
                          );
                          return {
                            ...current,
                            guestInfo: {
                              ...prev,
                              healthAndSafety: { ...healthPrev, safetyAdviceItems: nextList }
                            }
                          };
                        });
                        setActiveGuestSafetyAdviceIndexByKey((prev) => ({
                          ...prev,
                          [safetyKey]: Math.max(
                            0,
                            Math.min(activeSafetyIndex, safetyItems.length - 2)
                          )
                        }));
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>{t("admin.actions.removeItem")}</span>
                    </button>
                  </div>
                ) : null)}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingAdd) {
      return;
    }
    setIsSubmittingAdd(true);
    try {
      await onCreate(event);
      setShowAddModal(false);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const direction = getLanguageDirection(language);

  return (
    <div className="admin-root" dir={direction}>
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
        {showAddModal ? (
          <div className="admin-modal">
            <div className="admin-modal-card">
              <h2>{t("admin.addProperty.title")}</h2>
              <form className="admin-form" onSubmit={handleAddSubmit}>
                <label className="admin-field">
                  <span>{t("admin.addProperty.id")}</span>
                  <input
                    value={createId}
                    onChange={(event) => setCreateId(event.target.value)}
                    placeholder={t("admin.addProperty.idPlaceholder")}
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>{t("admin.addProperty.name")}</span>
                  <input
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder={t("admin.addProperty.namePlaceholder")}
                    required
                  />
                </label>
                <div className="admin-field">
                  <span>{t("admin.addProperty.listingType")}</span>
                  <AdminSelect
                    value={createStatus}
                    options={listingTypeOptions}
                    onChange={setCreateStatus}
                  />
                </div>
                <div className="admin-field">
                  <span>{t("admin.fields.listingLanguages")}</span>
                  <p className="help">{t("admin.fields.listingLanguagesHelp")}</p>
                  <div className="listing-languages-grid" role="group" aria-label={t("admin.fields.listingLanguages")}>
                    {supportedLanguages.map((option) => (
                      <label key={option.code} className="listing-language-checkbox">
                        <input
                          type="checkbox"
                          checked={createListingLanguages.includes(option.code)}
                          onChange={() => {
                            const next = createListingLanguages.includes(option.code)
                              ? createListingLanguages.filter((c) => c !== option.code)
                              : [...createListingLanguages, option.code];
                            if (next.length > 0) setCreateListingLanguages(next);
                          }}
                        />
                        <span className="listing-language-label">
                          <span className="listing-language-flag" aria-hidden="true">{option.flag}</span>
                          <span>{option.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="admin-actions">
                  <button type="button" className="admin-secondary" onClick={() => setShowAddModal(false)}>
                    {t("admin.addProperty.cancel")}
                  </button>
                  <button type="submit" className="admin-primary" disabled={isSubmittingAdd}>
                    {isSubmittingAdd ? <FontAwesomeIcon icon={faSpinner} /> : <FontAwesomeIcon icon={faPlus} />}<span>{isSubmittingAdd ? t("admin.addProperty.adding") : t("admin.addProperty.submit")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        {authExpired ? (
          <div className="admin-modal">
            <div className="admin-modal-card">
              <h2>{t("admin.session.expiredTitle")}</h2>
              <p className="muted">
                {t("admin.session.expiredBody")}
              </p>
              <button type="button" className="admin-primary fit-content" onClick={onExtendSession}>
                {t("admin.session.extendAction")}
              </button>
              <p className="muted admin-modal-note">
                {t("admin.session.returnNotice")}
              </p>
            </div>
          </div>
        ) : null}
      <header className="admin-header">
        <div className="admin-header-icon"><FontAwesomeIcon icon={faHomeLgAlt} /></div>
        <div>
          <h1>{t("admin.property.title")}</h1>
          <p className="muted">{t("admin.property.subtitle")}</p>
        </div>
        <div>
          {currentUser ? (
            <div>
              <p className="muted admin-user-summary">
                {t("admin.session.signedInAs")
                  .replace("{name}", currentUser.displayName || currentUser.username)
                  .replace(
                    "{roles}",
                    (currentUser.roles ?? [])
                      .map(getRoleLabel)
                      .join(", ") || t("admin.session.userFallback")
                  )}
              </p>
            </div>
          ) : null}

          <div className="admin-header-actions">
            {canViewFinancials ? (
              <button type="button" className="admin-secondary" onClick={() => router.push("/admin/users")}>
                <FontAwesomeIcon icon={faUsers} /><span>{t("admin.manageUsers")}</span>
              </button>
            ) : null}
            {canManageThemes ? (
              <button
                type="button"
                className="admin-secondary"
                onClick={() => router.push("/admin/themes")}
              >
                <FontAwesomeIcon icon={faPaintBrush} /><span>{t("admin.manageThemes")}</span>
              </button>
            ) : null}
            {canAddProperties ? (
              <button type="button" className="admin-primary" onClick={() => setShowAddModal(true)}>
                <FontAwesomeIcon icon={faPlus} /><span>{t("admin.addProperty")}</span>
              </button>
            ) : null}
            <button type="button" className="admin-danger" onClick={onLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /><span>{t("admin.logout")}</span>
            </button>
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      {isLoading ? (
        <p className="muted">{t("admin.property.loading")}</p>
      ) : (
        <div className="admin-grid">
          {(() => {
            const sortByName = (a: PropertyDto, b: PropertyDto) =>
              resolveLocalizedText(a.name, language).localeCompare(resolveLocalizedText(b.name, language));
            const rentals = properties
              .filter((property) => property.status.toLowerCase() === "rental")
              .sort(sortByName);
            const bothRentalAndSale = properties
              .filter((property) => property.status.toLowerCase() === "both")
              .sort(sortByName);
            const sales = properties
              .filter((property) => property.status.toLowerCase() === "sale")
              .sort(sortByName);
            const sortedProperties = [...properties]
              .sort((a, b) => resolveLocalizedText(a.name, language).localeCompare(resolveLocalizedText(b.name, language)));
            const renderCard = (property: PropertyDto) => {
            const draft = drafts[property.id] ?? property;
            const isExpanded = isSinglePropertyManager ? true : expandedCards[property.id] ?? false;
            const activeTab = activeTabById[property.id] ?? "overview";
            const draftThemeName = draft.themeName ?? property.themeName ?? property.theme?.name ?? "";
            const selectedTheme = draftThemeName
              ? themes.find((item) => item.name === draftThemeName)
              : null;
            const themeForVars = selectedTheme ?? draft.theme ?? property.theme ?? null;
              return (
                <section
                  key={property.id}
                  className={`card admin-card-themed property-theme-${
                    draft.themeName ?? property.themeName ?? property.theme?.name ?? property.id
                  }${canEditProperties ? "" : " admin-readonly"}`}
                  style={getThemeVars(themeForVars, mode)}
                >
                  <div className="admin-card-header">
                    <div className="admin-card-title">
                      <h1>{resolveLocalizedText(property.name, language)}</h1>
                      <div className="admin-card-meta">
                        {property.isPublished ? (
                          <span className="admin-status published">{t("admin.status.published")}</span>
                        ) : (
                          <span className="admin-status published">{t("admin.status.unpublished")}</span>
                        )}
                        {property.archived ? (
                          <span className="admin-status archived">{t("admin.status.archived")}</span>
                        ) : null}
                        {property.version ? (
                          <span className="admin-version">
                            {t("admin.property.versionLabel").replace("{version}", property.version)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="admin-card-controls">
                    {!isSinglePropertyManager ? (
                      <button
                        type="button"
                        className="admin-secondary admin-card-toggle"
                        aria-label={isExpanded ? t("admin.actions.collapse") : t("admin.actions.expand")}
                        onClick={() =>
                          setExpandedCards((prev) => ({
                            ...prev,
                            [property.id]: !isExpanded
                          }))
                        }
                      >
                        {isExpanded ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}<span>{isExpanded ? t("admin.actions.hide") : t("admin.actions.show")}</span>
                      </button>
                    ) : null}
                    </div>
                  </div>
                  {isExpanded ? (
                    <>
                      <div className="admin-tabs">
                        {tabOptions
                          .filter((tab) => {
                            if (isPropertyManager) {
                              return tab.value === "bookings";
                            }
                            return tab.value === "bookings"
                              ? property.status.toLowerCase() !== "sale"
                              : true;
                          })
                          .map((tab) => (
                          <button
                            key={tab.value}
                            type="button"
                            className={`admin-tab${activeTab === tab.value ? " active" : ""}`}
                            onClick={() =>
                              setActiveTabById((prev) => ({
                                ...prev,
                                [property.id]: tab.value
                              }))
                            }
                          >
                            {tab.value === "salesRental"
                              ? (() => {
                                  const s = (draft.status ?? "").toLowerCase();
                                  if (s === "sale") return t("admin.tabs.saleParticulars");
                                  if (s === "rental") return t("admin.tabs.rentalParticulars");
                                  return t("admin.tabs.saleRentalParticulars");
                                })()
                              : tab.label}
                          </button>
                        ))}
                      </div>
                      {renderTabContent(property, draft, activeTab)}
                      {canEditProperties ? (
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-danger"
                            onClick={() => onArchiveToggle(property)}
                          >
                           {property.archived ? <FontAwesomeIcon icon={faArchive} /> : <FontAwesomeIcon icon={faArchive} />}<span>{property.archived ? t("admin.actions.activateProperty") : t("admin.actions.archiveProperty")}</span>
                          </button>
                          {property.isPublished === false ? (
                            <div className="admin-button-group">
                              <button
                                type="button"
                                className="admin-primary"
                                onClick={() => onPublish(property)}
                              >
                                <FontAwesomeIcon icon={faUpload} /><span>{t("admin.actions.publishLastSaved")}</span>
                              </button>
                              <button
                                type="button"
                                className="admin-danger"
                                onClick={() => onRevert(property)}
                              >
                                <FontAwesomeIcon icon={faRotateLeft} /><span>{t("admin.actions.revertMinor")}</span>
                              </button>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            className="admin-primary"
                            onClick={() => onSave(property)}
                          >
                            <FontAwesomeIcon icon={faSave} /><span>{t("admin.actions.saveMinor")}</span>
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </section>
              );
            };

            if (isSinglePropertyManager) {
              return <>{sortedProperties.map(renderCard)}</>;
            }

            return (
              <>
                <h2 className="admin-section-title">{t("admin.sections.rentals")}</h2>
                {rentals.length === 0 ? (
                  <p className="muted">{t("admin.sections.rentals.none")}</p>
                ) : (
                  rentals.map(renderCard)
                )}
                <h2 className="admin-section-title">{t("admin.sections.both")}</h2>
                {bothRentalAndSale.length === 0 ? (
                  <p className="muted">{t("admin.sections.both.none")}</p>
                ) : (
                  bothRentalAndSale.map(renderCard)
                )}
                <h2 className="admin-section-title">{t("admin.sections.sales")}</h2>
                {sales.length === 0 ? (
                  <p className="muted">{t("admin.sections.sales.none")}</p>
                ) : (
                  sales.map(renderCard)
                )}
              </>
            );
          })()}
        </div>
      )}
      </section>
    </div>
  );
}
