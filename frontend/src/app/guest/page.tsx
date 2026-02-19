import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelect from "@/components/LanguageSelect";
import RichText from "@/components/RichText";
import { CollapsibleCard } from "@/components/GuestCollapsibleSection";
import { resolveImageUrl, tryGetProperty } from "@/lib/api";
import { createTranslator, getLanguageFromSearchParams, resolveLocalizedText } from "@/lib/i18n";
import { getLanguageDirection, isSupportedLanguage, normalizeLanguage, type LanguageCode } from "@/lib/i18n/languages";
import { findGuestBooking } from "@/lib/guestLink";
import type { PropertyDto } from "@/lib/types";

type SearchParams = {
  id?: string;
  lang?: string;
  bookingId?: string;
  bookingDate?: string;
};

function getGuestLanguage(booking: ReturnType<typeof findGuestBooking>): LanguageCode | null {
  if (!booking?.preferredLanguage) {
    return null;
  }
  if (!isSupportedLanguage(booking.preferredLanguage)) {
    return null;
  }
  return normalizeLanguage(booking.preferredLanguage);
}

function resolvePdfUrl(property: PropertyDto, pdfId: string | null | undefined): string | null {
  if (!pdfId?.trim()) {
    return null;
  }
  const pdf = property.pdfs?.find((p) => p.id === pdfId.trim());
  return pdf ? resolveImageUrl(property.id, pdf.src) : null;
}

export default async function GuestPage({ searchParams }: { searchParams?: SearchParams }) {
  const propertyId = searchParams?.id ?? "villa_janoula";
  const baseLanguage = getLanguageFromSearchParams(searchParams);
  const property = await tryGetProperty(propertyId, baseLanguage);

  if (!property) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5106";
    const t = createTranslator(baseLanguage);
    return (
      <section className="card">
        <h1>{t("property.dataUnavailable.title")}</h1>
        <p className="muted">{t("property.dataUnavailable.detail").replace("{baseUrl}", baseUrl)}</p>
      </section>
    );
  }

  const guestBooking = findGuestBooking(
    property,
    searchParams?.bookingId,
    searchParams?.bookingDate
  );

  if (!guestBooking) {
    const params = new URLSearchParams();
    if (propertyId) {
      params.set("id", propertyId);
    }
    redirect(`/?${params.toString()}`);
  }

  const language = getGuestLanguage(guestBooking) ?? baseLanguage;
  const t = createTranslator(language);
  const guestInfo = property.guestInfo;
  const hasContent =
    guestInfo &&
    (guestInfo.wifiNetworkName ||
      guestInfo.wifiPassword ||
      (guestInfo.equipmentInstructions && guestInfo.equipmentInstructions.length > 0) ||
      (guestInfo.healthAndSafety &&
        ((guestInfo.healthAndSafety.emergencyContacts?.length ?? 0) > 0 ||
          (guestInfo.healthAndSafety.safetyAdviceItems?.length ?? 0) > 0)));

  const backHref = `/?id=${encodeURIComponent(propertyId)}&source=guest&bookingId=${encodeURIComponent(searchParams?.bookingId ?? "")}&bookingDate=${encodeURIComponent(searchParams?.bookingDate ?? "")}`;

  const direction = getLanguageDirection(language);

  return (
    <ThemeProvider
      theme={property.theme}
      className={`property-theme-${property.theme?.name ?? property.id}`}
    >
      <div className="property-page-root" dir={direction}>
        <section className="">
          <div className="guest-info-header">
            <h1>{resolveLocalizedText(property.name, language)}</h1>
            <p className="muted">{t("property.guestInfo.title")}</p>
            <div className="guest-info-actions">
              <LanguageSelect allowedLanguages={property.listingLanguages?.length ? property.listingLanguages : undefined} />
              <ThemeToggle />
              <Link href={backHref} className="cta-button cta-guest-back">
                {t("property.guestInfo.backToProperty")}
              </Link>
            </div>
          </div>

          {!hasContent ? (
            <p className="muted">{t("property.guestInfo.noContent")}</p>
          ) : (
            <div className="guest-info-sections">
              <h2>{t("property.guestInfo.generalTitle")}</h2>
              {/* getting there - directions from airports, advice for downloaing maps before you land */}

              {/* getting in - the lockbox */}

              {/* wifi */}
              {(guestInfo?.wifiNetworkName || guestInfo?.wifiPassword) ? (
                <CollapsibleCard
                  title={t("property.guestInfo.wifiTitle")}
                  showLabel={t("property.guestInfo.show")}
                  hideLabel={t("property.guestInfo.hide")}
                  expandAriaLabel={t("property.guestInfo.expandSection")}
                  collapseAriaLabel={t("property.guestInfo.collapseSection")}
                >
                  <div className="card-content">
                    <div className="guest-info-block">
                        {guestInfo.wifiNetworkName ? (
                          <p>
                            <span className="muted">{t("property.guestInfo.wifiNetworkName")}: </span>
                            <strong>{guestInfo.wifiNetworkName}</strong>
                          </p>
                        ) : null}
                        {guestInfo.wifiPassword ? (
                          <p>
                            <span className="muted">{t("property.guestInfo.wifiPassword")}: </span>
                            <strong className="guest-wifi-password">{guestInfo.wifiPassword}</strong>
                          </p>
                        ) : null}
                        {guestInfo.wifiNotes ? (
                          <RichText
                            className="text-block guest-wifi-notes"
                            as="div"
                            text={resolveLocalizedText(guestInfo.wifiNotes, language)}
                            propertyId={property.id}
                          />
                        ) : null}
                      </div>
                    </div>
                </CollapsibleCard>
              ) : null}

              {guestInfo?.equipmentInstructions && guestInfo.equipmentInstructions.length > 0 ? (
                <CollapsibleCard
                  title={t("property.guestInfo.equipmentTitle")}
                    showLabel={t("property.guestInfo.show")}
                    hideLabel={t("property.guestInfo.hide")}
                    expandAriaLabel={t("property.guestInfo.expandSection")}
                    collapseAriaLabel={t("property.guestInfo.collapseSection")}
                  >
                    <div className="guest-info-block">
                    {guestInfo.equipmentInstructions.map((item) => {
                      const pdfUrl = resolvePdfUrl(property, item.pdfId);
                      const name = resolveLocalizedText(item.name, language);
                      const instructionsResolved = item.instructions
                        ? resolveLocalizedText(item.instructions, language)
                        : "";
                      return (
                        <div key={item.id} className="guest-equipment-item">
                          <h3>{name}</h3>
                          {instructionsResolved ? (
                            <RichText
                              className="text-block guest-equipment-instructions"
                              as="div"
                              text={instructionsResolved}
                              propertyId={property.id}
                            />
                          ) : null}
                          {pdfUrl ? (
                            <p>
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="guest-pdf-link"
                              >
                                {t("property.guestInfo.downloadPdf")}
                              </a>
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleCard>
              ) : null}

              {guestInfo?.healthAndSafety &&
              ((guestInfo.healthAndSafety.emergencyContacts?.length ?? 0) > 0 ||
                (guestInfo.healthAndSafety.safetyAdviceItems?.length ?? 0) > 0) ? (
                <div className="guest-info-sections">
                  <h2>{t("property.guestInfo.healthAndSafetyTitle")}</h2>

                  {(guestInfo.healthAndSafety.safetyAdviceItems?.length ?? 0) > 0 ? (
                    <CollapsibleCard
                      title={t("property.guestInfo.safetyAdvice")}
                      showLabel={t("property.guestInfo.show")}
                      hideLabel={t("property.guestInfo.hide")}
                      expandAriaLabel={t("property.guestInfo.expandSection")}
                      collapseAriaLabel={t("property.guestInfo.collapseSection")}
                    >
                      <div className="card-content">
                        <div className="guest-safety-advice-items">
                          {guestInfo.healthAndSafety.safetyAdviceItems!.map((item, idx) => (
                            <div key={idx} className="guest-safety-advice-item">
                              {item.topic ? (
                                <h4>{resolveLocalizedText(item.topic, language)}</h4>
                              ) : null}
                              {item.notes ? (
                                <RichText
                                  className="text-block"
                                  as="div"
                                  text={resolveLocalizedText(item.notes, language)}
                                  propertyId={property.id}
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleCard>
                  ) : null}

                  {(guestInfo.healthAndSafety.emergencyContacts?.length ?? 0) > 0 ? (
                    <div className="guest-emergency-contacts">
                      {["Emergency Services", "Medical Centres", "Pharmacies"].map((cat) => {
                        const filtered =
                          guestInfo.healthAndSafety!.emergencyContacts!.filter(
                            (c) => c.category === cat
                          ) ?? [];
                        const items = [...filtered].sort((a, b) => {
                          const da = a.distance ?? Number.POSITIVE_INFINITY;
                          const db = b.distance ?? Number.POSITIVE_INFINITY;
                          return da - db;
                        });
                        if (items.length === 0) return null;
                        const categoryLabelKey =
                          cat === "Emergency Services"
                            ? "property.guestInfo.categoryEmergencyServices"
                            : cat === "Medical Centres"
                              ? "property.guestInfo.categoryMedicalCentres"
                              : "property.guestInfo.categoryPharmacies";
                        const isEmergencyServices = cat === "Emergency Services";
                        return (
                          <div
                            key={cat}
                            className={
                              isEmergencyServices
                                ? "guest-emergency-category guest-emergency-services-section"
                                : "guest-emergency-category"
                            }
                          >
                          <CollapsibleCard
                                title={t(categoryLabelKey)}
                                showLabel={t("property.guestInfo.show")}
                                hideLabel={t("property.guestInfo.hide")}
                                expandAriaLabel={t("property.guestInfo.expandSection")}
                                collapseAriaLabel={t("property.guestInfo.collapseSection")}
                              >
                                {isEmergencyServices ? (
                                  <div className="guest-emergency-services-grid">
                                    {items.map((contact, idx) => {
                                      const nameResolved = contact.name
                                        ? resolveLocalizedText(contact.name, language)
                                        : "";
                                      return (
                                        <div
                                          key={`${cat}-${idx}`}
                                          className="guest-emergency-box"
                                        >
                                          {nameResolved ? (
                                            <h5 className="guest-emergency-box-title">
                                              {nameResolved}
                                            </h5>
                                          ) : null}
                                          {contact.phone ? (
                                            <a
                                              href={`tel:${contact.phone}`}
                                              className="guest-emergency-box-phone"
                                            >
                                              {contact.phone}
                                            </a>
                                          ) : null}
                                          {contact.notes ? (
                                            <RichText
                                              className="text-block guest-emergency-box-notes"
                                              as="div"
                                              text={resolveLocalizedText(
                                                contact.notes,
                                                language
                                              )}
                                              propertyId={property.id}
                                            />
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  items.map((contact, idx) => {
                                    const contactImages =
                                      (contact.images?.length ?? 0) > 0
                                        ? contact.images ?? []
                                        : contact.image
                                          ? [contact.image]
                                          : [];
                                    const firstImage = contactImages[0];
                                    const hasRichContent =
                                      (firstImage?.src != null &&
                                        firstImage.src !== "") ||
                                      contact.mapReference ||
                                      (contact.links?.length ?? 0) > 0;
                                    const nameResolved = contact.name
                                      ? resolveLocalizedText(
                                          contact.name,
                                          language
                                        )
                                      : "";
                                    return (
                                      <div
                                        key={`${cat}-${idx}`}
                                        className={
                                          hasRichContent
                                            ? "guest-contact-card guest-contact-with-media"
                                            : "guest-contact-card"
                                        }
                                      >
                                      {nameResolved ? (
                                        <h5 className="guest-contact-name">
                                          {nameResolved}
                                          {contact.distance != null &&
                                          !Number.isNaN(contact.distance) ? (
                                            <span className="guest-contact-distance">
                                              {" "}
                                              ({contact.distance} km)
                                            </span>
                                          ) : null}
                                        </h5>
                                      ) : null}
                                      {contact.phone ? (
                                        <div className="guest-contact-phone">
                                          <a href={`tel:${contact.phone}`}>
                                            {contact.phone}
                                          </a>
                                        </div>
                                      ) : null}
                                      {hasRichContent ? (
                                        <div className="experience">
                                          {firstImage?.src ? (
                                            <div className="section-hero guest-contact-photo">
                                              <img
                                                src={resolveImageUrl(property.id, firstImage.src)}
                                                alt={
                                                  firstImage.alt
                                                    ? resolveLocalizedText(
                                                        firstImage.alt,
                                                        language
                                                      )
                                                    : nameResolved || ""
                                                }
                                              />
                                            </div>
                                          ) : null}
                                          {contactImages.length > 1 ? (
                                            <div className="guest-contact-gallery">
                                              {contactImages.slice(1).map((img, i) => (
                                                <img
                                                  key={i}
                                                  src={resolveImageUrl(property.id, img.src)}
                                                  alt={
                                                    img.alt
                                                      ? resolveLocalizedText(img.alt, language)
                                                      : nameResolved || ""
                                                  }
                                                />
                                              ))}
                                            </div>
                                          ) : null}
                                          <div className="experience-text">
                                            {contact.notes ? (
                                              <RichText
                                                className="text-block guest-contact-notes"
                                                as="div"
                                                text={resolveLocalizedText(
                                                  contact.notes,
                                                  language
                                                )}
                                                propertyId={property.id}
                                              />
                                            ) : null}
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="guest-contact-main">
                                            {contact.distance != null &&
                                            !Number.isNaN(contact.distance) ? (
                                              <span className="guest-contact-distance">
                                                {contact.distance} km
                                              </span>
                                            ) : null}
                                            {contact.phone ? (
                                              <>
                                                {" "}
                                                <a href={`tel:${contact.phone}`}>
                                                  {contact.phone}
                                                </a>
                                              </>
                                            ) : null}
                                          </span>
                                          {contact.notes ? (
                                            <RichText
                                              className="text-block guest-contact-notes"
                                              as="div"
                                              text={resolveLocalizedText(
                                                contact.notes,
                                                language
                                              )}
                                              propertyId={property.id}
                                            />
                                          ) : null}
                                        </>
                                      )}
                                      {contact.mapReference ||
                                      (contact.links?.length ?? 0) > 0 ? (
                                        <div className="cta-row">
                                          {contact.mapReference ? (
                                            <a
                                              className="cta-button cta-map"
                                              href={contact.mapReference}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              {t("property.viewMap")}
                                            </a>
                                          ) : null}
                                          {(contact.links ?? []).map((link, linkIdx) => {
                                            const label = link.label
                                              ? resolveLocalizedText(link.label, language)
                                              : t("property.visitWebsite");
                                            return (
                                              <a
                                                key={`${cat}-${idx}-link-${linkIdx}`}
                                                className="cta-button"
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                              >
                                                {label}
                                              </a>
                                            );
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
                                      );
                                    })
                                  )}
                              </CollapsibleCard>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </ThemeProvider>
  );
}
