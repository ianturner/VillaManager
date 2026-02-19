"use client";

import { useRef } from "react";
import type { ImageDto, PropertyDto } from "@/lib/types";
import HeroSlideshow from "@/components/HeroSlideshow";
import PropertyPageViewer from "@/components/PropertyPageViewer";
import { resolveLocalizedText } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n/useLanguage";

type PropertyPageWithHeroProps = {
  property: PropertyDto;
  heroImages: PropertyDto["heroImages"];
  /** Content to render between the hero and PropertyPageViewer (e.g. the main card). */
  children: React.ReactNode;
  /** Overlay content for the hero (language select, theme toggle, guest link, etc.). */
  heroOverlay: React.ReactNode;
};

/**
 * Wraps the hero slideshow and PropertyPageViewer so the hero can open the shared image viewer.
 * Registers the viewer's openGallery with a ref and passes onOpenInViewer to the hero.
 */
export default function PropertyPageWithHero({
  property,
  heroImages,
  children,
  heroOverlay
}: PropertyPageWithHeroProps) {
  const { language, t } = useTranslations();
  const openGalleryRef = useRef<((images: ImageDto[], index: number, title: string) => void) | null>(null);
  const images = heroImages ?? [];
  const propertyName = resolveLocalizedText(property.name, language);

  const handleOpenHeroInViewer = () => {
    if (images.length === 0) return;
    openGalleryRef.current?.(images, 0, propertyName || t("property.gallery"));
  };

  return (
    <>
      {images.length > 0 ? (
        <HeroSlideshow
          className="hero-banner"
          propertyId={property.id}
          images={images}
          overlay={heroOverlay}
          transitionStyle={property.heroSettings?.transition}
          onOpenInViewer={handleOpenHeroInViewer}
          openInViewerLabel={t("hero.openInViewer")}
        />
      ) : null}
      {children}
      <PropertyPageViewer
        property={property}
        onOpenGalleryReady={(openGallery) => {
          openGalleryRef.current = openGallery;
        }}
      />
    </>
  );
}
