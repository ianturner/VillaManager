"use client";

import { resolveImageUrl } from "@/lib/api";
import { createTranslator, resolveLocalizedText } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n/languages";
import type { PropertyLinkDto } from "@/lib/types";

export type PropertyListingCtasProperty = {
  id: string;
  status?: string | null;
  externalLinks?: PropertyLinkDto[] | null;
  salesParticulars?: { price?: string | null; documents?: string[] | null } | null;
};

function getProviderLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("airbnb.")) return "AirBnb";
  if (lower.includes("booking.com")) return "Booking.com";
  if (lower.includes("vrbo.")) return "Vrbo";
  return "External site";
}

type Props = {
  property: PropertyListingCtasProperty;
  language: LanguageCode;
};

/**
 * Renders rental platform buttons and/or sale CTA for a property based on listing type.
 * - Rental/both: external booking links (e.g. AirBnb, Booking.com).
 * - Sale/both: "For sale - [price]" as a link to sales particulars when available, else text.
 * - Both: rental at start and sale at end on one row (cta-sale-row).
 */
export default function PropertyListingCtas({ property, language }: Props) {
  const t = createTranslator(language);
  const status = (property.status ?? "").toLowerCase();
  const showRentalLinks =
    (status === "rental" || status === "both") &&
    (property.externalLinks?.length ?? 0) > 0;
  const showSaleInfo =
    (status === "sale" || status === "both") &&
    (property.salesParticulars?.price || property.salesParticulars?.documents?.[0]);

  if (!showRentalLinks && !showSaleInfo) {
    return <p className="muted">Status: {property.status}</p>;
  }

  const rentalBlock =
    showRentalLinks && property.externalLinks ? (
      <div className="cta-row">
        {property.externalLinks.map((link) => {
          const provider = getProviderLabel(link.url);
          const label = link.label
            ? resolveLocalizedText(link.label, language)
            : t("property.externalAvailability").replace("{provider}", provider);
          return (
            <a
              key={link.url}
              className={`cta-button cta-${provider.toLowerCase().replace(/\./g, "")}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {label}
            </a>
          );
        })}
      </div>
    ) : null;

  const saleBlock = showSaleInfo ? (
    <div className="sale-info">
      {(() => {
        const price = property.salesParticulars?.price;
        const caption = price
          ? `${t("property.sale.forSale")} - ${price}`
          : t("property.sale.forSale");
        const documentUrl = property.salesParticulars?.documents?.[0];
        const buttonClass = "cta-button cta-sales";
        if (documentUrl) {
          return (
            <a
              className={buttonClass}
              href={resolveImageUrl(property.id, documentUrl)}
              target="_blank"
              rel="noreferrer"
            >
              {caption}
            </a>
          );
        }
        return <span className={buttonClass}>{caption}</span>;
      })()}
    </div>
  ) : null;

  if (showRentalLinks && showSaleInfo) {
    return (
      <div className="cta-sale-row" role="group">
        {rentalBlock}
        {saleBlock}
      </div>
    );
  }

  if (showSaleInfo) {
    return (
      <div className="cta-sale-row cta-sale-row--trailing" role="group">
        {saleBlock}
      </div>
    );
  }

  return <>{rentalBlock}</>;
}
