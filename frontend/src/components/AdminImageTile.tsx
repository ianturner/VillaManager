"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { resolveImageUrl } from "@/lib/api";
import { resolveLocalizedText } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n/useLanguage";
import LocalizedTextField from "@/components/LocalizedTextField";
import type { LocalizedString } from "@/lib/types";

function getImageFilename(src: string): string {
  if (!src) return "";
  const normalized = src.split("?")[0];
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? src;
}

export type AdminImageTileProps = {
  propertyId: string;
  src: string;
  pathPlaceholder?: string;
  onSrcChange: (src: string) => void;
  /** When true, renders caption field. Requires alt, onAltChange, and languageOptions. */
  showCaption?: boolean;
  alt?: string | LocalizedString | null | undefined;
  onAltChange?: (alt: LocalizedString | null) => void;
  languageOptions?: { code: string; label: string; flag: string }[];
  /** When provided, shows remove/clear button that calls this on click */
  onRemove?: () => void;
  removeAriaLabel?: string;
};

/**
 * Reusable admin image picker tile: thumbnail, path input, optional caption,
 * optional remove button. Used for hero images, section images, registration
 * image, etc.
 */
export default function AdminImageTile({
  propertyId,
  src,
  pathPlaceholder,
  onSrcChange,
  showCaption = false,
  alt,
  onAltChange,
  languageOptions,
  onRemove,
  removeAriaLabel
}: AdminImageTileProps) {
  const { t, language } = useTranslations();

  return (
    <div className="admin-image-tile">
      <div className="admin-image-thumb">
        {src ? (
          <img
            src={resolveImageUrl(propertyId, src)}
            alt={resolveLocalizedText(alt ?? getImageFilename(src), language)}
          />
        ) : (
          <span className="admin-image-placeholder">{t("admin.images.none")}</span>
        )}
      </div>
      <input
        className="admin-image-input"
        value={src}
        placeholder={pathPlaceholder ?? t("admin.images.path")}
        onChange={(e) => onSrcChange(e.target.value)}
      />
      {showCaption && languageOptions && onAltChange !== undefined && (
        <LocalizedTextField
          languageOptions={languageOptions}
          className="admin-image-caption"
          label={t("admin.images.caption")}
          value={alt}
          placeholder={t("admin.images.caption")}
          onChange={onAltChange}
        />
      )}
      {onRemove && (
        <button
          type="button"
          className="admin-image-remove"
          aria-label={removeAriaLabel ?? t("admin.actions.removeImage")}
          onClick={onRemove}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );
}
