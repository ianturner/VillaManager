import PropertyListingCtas from "@/components/PropertyListingCtas";
import PropertyPageWithHero from "@/components/PropertyPageWithHero";
import RichText from "@/components/RichText";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelect from "@/components/LanguageSelect";
import { getApiBaseUrl, tryGetProperty } from "@/lib/api";
import { createTranslator, getLanguageFromSearchParams, resolveLocalizedText } from "@/lib/i18n";
import { getLanguageDirection, isSupportedLanguage, normalizeLanguage, type LanguageCode } from "@/lib/i18n/languages";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

type SearchParams = {
  id?: string;
  source?: string;
  bookingId?: string;
  bookingDate?: string;
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

const isYes = (value?: string | null) => (value ?? "").toLowerCase() === "yes";

const normalizeToken = (value?: string | null) => (value ?? "").trim().toLowerCase();
const normalizeDateToken = (value?: string | null) =>
  normalizeToken(value).replace(/[^0-9]/g, "");

const findGuestBooking = (
  property: Awaited<ReturnType<typeof tryGetProperty>>,
  bookingId?: string | null,
  bookingDate?: string | null
) => {
  const bookings = property?.rental?.bookings ?? [];
  if (bookings.length === 0) {
    return null;
  }
  const idToken = normalizeToken(bookingId);
  const dateToken = normalizeDateToken(bookingDate);
  if (!idToken || !dateToken) {
    return null;
  }
  return (
    bookings.find((booking) =>
      normalizeToken(booking.bookingId) === idToken
      && normalizeDateToken(booking.dateOfBooking) === dateToken
    ) ?? null
  );
};

const getGuestLanguage = (booking: ReturnType<typeof findGuestBooking>): LanguageCode | null => {
  if (!booking?.preferredLanguage) {
    return null;
  }
  if (!isSupportedLanguage(booking.preferredLanguage)) {
    return null;
  }
  return normalizeLanguage(booking.preferredLanguage);
};

export default async function Home({ searchParams }: { searchParams?: SearchParams }) {
  const propertyId = searchParams?.id ?? "villa_janoula";
  const baseLanguage = getLanguageFromSearchParams(searchParams);
  const property = await tryGetProperty(propertyId, baseLanguage);
  const isGuestSource = searchParams?.source?.toLowerCase() === "guest";
  const guestBooking = isGuestSource
    ? findGuestBooking(property, searchParams?.bookingId, searchParams?.bookingDate)
    : null;
  if (isGuestSource && !guestBooking) {
    const params = new URLSearchParams();
    if (propertyId) {
      params.set("id", propertyId);
    }
    redirect(`/?${params.toString()}`);
  }
  const guestLanguage = getGuestLanguage(guestBooking);
  const language = guestLanguage ?? baseLanguage;
  const t = createTranslator(language);

  if (isGuestSource && guestLanguage && guestLanguage !== baseLanguage) {
    const params = new URLSearchParams();
    if (propertyId) {
      params.set("id", propertyId);
    }
    params.set("source", "guest");
    params.set("lang", guestLanguage);
    redirect(`/?${params.toString()}`);
  }

  if (!property) {
    const baseUrl = getApiBaseUrl();
    return (
      <section className="card">
        <h1>{t("property.dataUnavailable.title")}</h1>
        <p className="muted">
          {t("property.dataUnavailable.detail").replace("{baseUrl}", baseUrl)}
        </p>
        <p className="muted">
          {t("property.dataUnavailable.hint")}
        </p>
      </section>
    );
  }

  const heroImages = property.heroImages ?? [];
  const hasArrivedValue = (guestBooking?.hasArrived ?? "").toLowerCase();
  const showWelcome =
    isGuestSource
    && guestBooking?.names
    && hasArrivedValue !== "no";
  const isRepeatVisit =
    (guestBooking?.repeatVisit ?? "").toLowerCase() === "yes";
  const welcomeText = showWelcome
    ? (isRepeatVisit ? t("property.guestWelcomeBack") : t("property.guestWelcome"))
      .replace("{name}", guestBooking?.names?.split(' ')[0] ?? "")
    : "";

  const guestInfoUrl =
    isGuestSource && guestBooking
      ? `/guest?id=${encodeURIComponent(propertyId)}&bookingId=${encodeURIComponent(searchParams?.bookingId ?? "")}&bookingDate=${encodeURIComponent(searchParams?.bookingDate ?? "")}${language !== baseLanguage ? `&lang=${language}` : ""}`
      : null;

  const direction = getLanguageDirection(language);
  const isGuestBookingUrl = !!(searchParams?.bookingId);

  return (
    <ThemeProvider theme={property.theme} className={`property-theme-${property.theme?.name ?? property.id}`}>
      <div className="property-page-root" dir={direction}>
        <PropertyPageWithHero
          property={property}
          heroImages={heroImages}
          heroOverlay={
            <>
              <div className="hero-overlay">
                {guestInfoUrl ? (
                  <div className="hero-button-container">
                    <a
                      href={guestInfoUrl}
                      className="hero-guest-info-btn"
                      title={t("property.guestInfo.linkToGuestInfo")}
                      aria-label={t("property.guestInfo.linkToGuestInfo")}
                    >
                      <span className="hero-guest-info-icon" aria-hidden="true">
                        <FontAwesomeIcon icon={faInfo} />
                      </span>
                    </a>
                  </div>
                ) : null}
                <LanguageSelect allowedLanguages={property.listingLanguages?.length ? property.listingLanguages : undefined} />
                <ThemeToggle />
              </div>
              {showWelcome ? (
                <div className="hero-guest-welcome" aria-live="polite">
                  <p className="hero-guest-welcome-salutation">{welcomeText}</p>
                  {guestInfoUrl ? (
                    <p className="hero-guest-welcome-review">
                      {t("property.guestInfo.reviewPrompt")}
                      <a href={guestInfoUrl} className="hero-guest-welcome-review-link">
                        {t("property.guestInfo.reviewLinkText")}
                      </a>
                      {t("property.guestInfo.reviewPromptEnd")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          }
        >
        <section className="card">
          <h1>{resolveLocalizedText(property.name, language)}</h1>
          {property.location?.address ? (
            <p className="location">
              <span className="location-icon" aria-hidden="true">
                📍
              </span>
              <span>{resolveLocalizedText(property.location.address, language)}</span></p>
          ) : null}
          {property.facts ? (
            <div className="facts-row">
              {property.facts.bedrooms ? (
                <div className="fact bedrooms">
                  <span className="fact-icon" aria-hidden="true">
                    🛏
                  </span>
                  <span>{property.facts.bedrooms} {t("property.facts.bedrooms")}</span>
                </div>
              ) : null}
              {property.facts.bathrooms ? (
                <div className="fact bathrooms">
                  <span className="fact-icon" aria-hidden="true">
                    🛁
                  </span>
                  <span>{property.facts.bathrooms} {t("property.facts.bathrooms")}</span>
                </div>
              ) : null}
              {property.facts.kitchens ? (
                <div className="fact kitchens">
                  <span className="fact-icon" aria-hidden="true">
                    🥘
                  </span>
                  <span>{property.facts.kitchens} {t("property.facts.kitchens")}</span>
                </div>
              ) : null}
              {property.facts.interiorAreaSqm ? (
                <div className="fact interiorAreaSqm">
                  <span className="fact-icon" aria-hidden="true">
                    🧱
                  </span>
                  <span>{property.facts.interiorAreaSqm} {t("property.facts.interior")}</span>
                </div>
              ) : null}
              {property.facts.landAreaSqm ? (
                <div className="fact landAreaSqm">
                  <span className="fact-icon" aria-hidden="true">
                    🌿
                  </span>
                  <span>{property.facts.landAreaSqm} {t("property.facts.land")}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {property.summary ? (
            <RichText
              className="text-block"
              as="p"
              text={resolveLocalizedText(property.summary, language)}
              propertyId={property.id}
            />
          ) : null}
          {!isGuestBookingUrl ? (
            <PropertyListingCtas property={property} language={language} />
          ) : null}
        </section>
        </PropertyPageWithHero>
      </div>
    </ThemeProvider>
  );
}
