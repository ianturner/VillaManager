"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropertyDto, PropertyPageDto } from "@/lib/types";
import HeroSlideshow from "@/components/HeroSlideshow";
import PropertyPageNav from "@/components/PropertyPageNav";
import RichText from "@/components/RichText";
import { resolveImageUrl } from "@/lib/api";
import { resolveLocalizedText } from "@/lib/i18n";
import { defaultLanguage } from "@/lib/i18n/languages";
import { useTranslations } from "@/lib/i18n/useLanguage";

type PropertyPageViewerProps = {
  property: PropertyDto;
  /** Called when the viewer is ready; pass this to open the shared image viewer from outside (e.g. hero gallery button). */
  onOpenGalleryReady?: (openGallery: (
    images: PropertyPageDto["sections"][0]["images"],
    index: number,
    title: string
  ) => void) => void;
};

function FacilityIcon({ icon, text }: { icon: string; text: string }) {
  const raw = icon?.trim() || "circle";
  const normalized = raw.includes(":") ? raw : `regular:${raw}`;
  const [style, name] = normalized.split(":");
  const styleClass =
    style === "brands" ? "fa-brands" : style === "regular" ? "fa-regular" : "fa-solid";
  return <i className={`${styleClass} fa-${name || "circle"}`} title={text} aria-hidden="true" />;
}

export default function PropertyPageViewer({ property, onOpenGalleryReady }: PropertyPageViewerProps) {
  const { language, t } = useTranslations();
  const pages = property.pages ?? [];
  const configuredPlaces = property.places;
  const places = useMemo(() => {
    return configuredPlaces ?? null;
  }, [configuredPlaces]);
  const hasPlaces = Boolean(places && (places.items ?? []).length > 0);
  const getCategoryValue = (value: string | Record<string, string> | null | undefined) =>
    resolveLocalizedText(value ?? "", defaultLanguage).trim();
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const derivedSections = useMemo(() => {
    if (!places) {
      return [];
    }
    const seen = new Set<string>();
    return (places.items ?? [])
      .map((item) => {
        const categoryValue = getCategoryValue(item.category);
        const title = resolveLocalizedText(item.category ?? "", language) || categoryValue;
        return { categoryValue, title };
      })
      .filter((value) => value.categoryValue.length > 0)
      .filter((value) => {
        const key = value.categoryValue.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((value) => ({
        id: slugify(value.categoryValue) || value.categoryValue,
        title: value.title,
        categoryValue: value.categoryValue,
        description: "",
        icon: ""
      }));
  }, [getCategoryValue, language, places]);
  const placeSections = useMemo(() => {
    if (!places) {
      return [];
    }
    const configured = places.sections ?? [];
    if (configured.length === 0) {
      return derivedSections;
    }
    return configured.map((section) => ({
      id: section.id?.trim() || slugify(section.categoryValue ?? "") || section.categoryValue || "section",
      title: resolveLocalizedText(section.title ?? "", language)
        || section.categoryValue
        || t("property.places.other"),
      description: resolveLocalizedText(section.description ?? "", language),
      icon: section.icon ?? "",
      categoryValue: section.categoryValue ?? ""
    }));
  }, [derivedSections, language, places, t]);
  const navItems = [
    ...pages.map((page) => ({
      id: page.id,
      title: resolveLocalizedText(page.title, language),
      showSectionsSubmenu: (page.showSectionsSubmenu ?? "").toLowerCase() === "yes",
      sections: page.sections
        .filter((section) => Boolean(section.title))
        .map((section) => ({ id: section.id, title: resolveLocalizedText(section.title ?? "", language) }))
    })),
    ...(hasPlaces ? [{
      id: "places",
      title: resolveLocalizedText(places?.pageTitle ?? "", language) || t("property.places.title"),
      showSectionsSubmenu: true,
      sections: placeSections.map((section) => ({ id: section.id, title: section.title }))
    }] : []),
    ...(property.facilities.length > 0 ? [{ id: "facilities", title: t("property.facilities") }] : [])
  ];
  const placesTitle =
    resolveLocalizedText(places?.pageTitle ?? "", language) || t("property.places.title");
  const placesDescription = resolveLocalizedText(places?.description ?? "", language);
  const filterItemsForSection = (
    items: NonNullable<typeof places>["items"],
    categoryValue: string
  ) => {
    const normalized = categoryValue.trim().toLowerCase();
    return items.filter((item) => {
      const value = getCategoryValue(item.category).toLowerCase();
      if (!normalized) {
        return value.length === 0;
      }
      return value === normalized;
    });
  };
  const defaultId = navItems[0]?.id ?? "facilities";
  const [selectedId, setSelectedId] = useState(defaultId);
  const [selectedPlacesSectionId, setSelectedPlacesSectionId] = useState<string | null>(null);
  const [viewerImages, setViewerImages] = useState<PropertyPageDto["sections"][0]["images"]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerTitle, setViewerTitle] = useState("");
  const contentCardRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);

  const facilityGroups = property.facilities;

  const isFacilities = selectedId === "facilities";
  const isPlaces = selectedId === "places";
  const selectedPlaces = isPlaces ? places : null;
  const selectedPage: PropertyPageDto | undefined = useMemo(() => {
    if (isFacilities || isPlaces) {
      return undefined;
    }
    return pages.find((page) => page.id === selectedId) ?? pages[0];
  }, [isFacilities, isPlaces, pages, selectedId]);
  const heroImages = selectedPage?.heroImages ?? [];
  const isViewerOpen = viewerImages.length > 0;

  useEffect(() => {
    if (!contentCardRef.current) {
      return;
    }
    if (!shouldScrollRef.current) {
      return;
    }
    shouldScrollRef.current = false;
    contentCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  useEffect(() => {
    if (selectedId !== "places") {
      setSelectedPlacesSectionId(null);
      return;
    }
    if (!selectedPlacesSectionId) {
      return;
    }
    const exists = placeSections.some((section) => section.id === selectedPlacesSectionId);
    if (!exists) {
      setSelectedPlacesSectionId(null);
    }
  }, [placeSections, selectedId, selectedPlacesSectionId]);

  useEffect(() => {
    if (!selectedPlacesSectionId) {
      return;
    }
    const sectionEl = document.getElementById(`section-${selectedPlacesSectionId}`);
    sectionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedPlacesSectionId]);

  const openGallery = useCallback(
    (
      images: PropertyPageDto["sections"][0]["images"],
      index: number,
      title: string
    ) => {
      setViewerImages(images);
      setViewerIndex(index);
      setViewerTitle(title);
    },
    []
  );

  useEffect(() => {
    onOpenGalleryReady?.(openGallery);
  }, [onOpenGalleryReady, openGallery]);

  const sortByDistance = (items: NonNullable<typeof places>["items"]) =>
    [...items].sort((left, right) => {
      const leftDistance = left.distance ?? Number.POSITIVE_INFINITY;
      const rightDistance = right.distance ?? Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });

  const renderExperienceItems = (
    items: NonNullable<typeof places>["items"],
    fallbackTitle: string
  ) =>
    sortByDistance(items).map((item, index) => {
      const headingText = resolveLocalizedText(item.heading ?? "", language);
      const viewerFallback = headingText || fallbackTitle;
      const galleryImages = item.galleryImages ?? [];
      const links = item.links ?? [];
      const itemText = resolveLocalizedText(item.itemText ?? "", language);
      return (
        <div className="page-section" key={`${headingText || "experience"}-${index}`}>
          {headingText ? <h4>{headingText}</h4> : null}
          <div className="experience">
            {(item.heroImages ?? []).length > 0 ? (
              <HeroSlideshow
                className="hero section-hero"
                propertyId={property.id}
                images={item.heroImages ?? []}
                transitionStyle={property.heroSettings?.transition}
              />
            ) : null}
            <div className="experience-text">
              {itemText ? (
                <RichText
                  className="text-block"
                  as="p"
                  text={itemText}
                  propertyId={property.id}
                />
              ) : null}
            </div>
          </div>
          {galleryImages.length > 0 ? (
            <div className="image-grid">
              {galleryImages.map((image, imageIndex) => (
                <figure key={`${image.src}-${imageIndex}`}>
                  <button
                    type="button"
                    className="image-grid-button"
                    onClick={() => openGallery(galleryImages, imageIndex, viewerFallback)}
                    aria-label={t("property.openImage")
                      .replace("{index}", String(imageIndex + 1))
                      .replace("{section}", viewerFallback || t("property.gallery"))}
                  >
                    <img
                      src={resolveImageUrl(property.id, image.src)}
                      alt={resolveLocalizedText(image.alt, language)}
                    />
                  </button>
                  <figcaption className="muted">{resolveLocalizedText(image.alt, language)}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          {item.mapReference || links.length > 0 ? (
            <div className="cta-row">
              {item.mapReference ? (
                <a
                  className="cta-button cta-map"
                  href={item.mapReference}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("property.viewMap")}
                </a>
              ) : null}
              {links.map((link) => {
                const label = link.label
                  ? resolveLocalizedText(link.label, language)
                  : t("property.visitWebsite");
                return (
                  <a
                    key={`${link.url}-${label}`}
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
    });

  if (!selectedPage && !isFacilities && !selectedPlaces) {
    return null;
  }

  return (
    <section className="section page-layout">
      <PropertyPageNav
        pages={navItems}
        selectedId={selectedId}
        selectedSectionId={selectedPlacesSectionId}
        onSelect={(id) => {
          shouldScrollRef.current = true;
          setSelectedId(id);
          setSelectedPlacesSectionId(null);
        }}
        onSelectSection={(pageId, sectionId) => {
          if (pageId !== selectedId) {
            return;
          }
          setSelectedPlacesSectionId(sectionId);
        }}
      />
      <div className="card" ref={contentCardRef}>
        {isFacilities ? (
          <>
            <h2>{t("property.facilities")}</h2>
            <div className="facility-sections">
              {facilityGroups.map((group) => (
                <section key={resolveLocalizedText(group.title, language)} className="facility-section">
                  <h4>
                    <span className="facility-group-icon" aria-hidden="true">
                      <FacilityIcon icon={group.icon ?? "circle-check"} text={resolveLocalizedText(group.title, language)} />
                    </span>
                    {resolveLocalizedText(group.title, language)}
                  </h4>
                  <ul className="facility-grid">
                    {group.items.map((facility, index) => (
                      <li key={`${resolveLocalizedText(facility.text, language)}-${index}`} className="facility-item">
                        <span className="facility-icon" aria-hidden="true">
                          <FacilityIcon icon="square" text={resolveLocalizedText(facility.text, language)} />
                        </span>
                        <span>{resolveLocalizedText(facility.text, language)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        ) : selectedPlaces ? (
          <>
            <h2>
              {placesTitle}
            </h2>
            {placesDescription ? (
              <RichText
                className="text-block"
                as="p"
                text={placesDescription}
                propertyId={property.id}
              />
            ) : null}
            {placeSections.length > 0 ? (
              <div className="experience-groups">
                {(selectedPlacesSectionId
                  ? placeSections.filter((section) => section.id === selectedPlacesSectionId)
                  : placeSections
                ).map((section) => {
                  const items = filterItemsForSection(selectedPlaces.items ?? [], section.categoryValue);
                  return (
                    <section key={section.id} id={`section-${section.id}`} className="experience-group">
                      <h3 className="experience-group-title">
                        {section.icon ? (
                          <span className="experience-group-icon">
                            <FacilityIcon icon={section.icon} text={section.title} />
                          </span>
                        ) : null}
                        {section.title}
                      </h3>
                      {section.description ? (
                        <RichText
                          className="muted text-block experience-group-description"
                          as="p"
                          text={section.description}
                          propertyId={property.id}
                        />
                      ) : null}
                      {items.length > 0
                        ? renderExperienceItems(items, section.title)
                        : <p className="muted">{t("property.places.none")}</p>}
                    </section>
                  );
                })}
              </div>
            ) : (
              renderExperienceItems(selectedPlaces.items ?? [], placesTitle)
            )}
          </>
        ) : (
          <>
            {heroImages.length > 0 ? (
              <HeroSlideshow
                className="hero"
                propertyId={property.id}
                images={heroImages}
                transitionStyle={property.heroSettings?.transition}
              />
            ) : null}
            {selectedPage?.heroText ? (
              <RichText
                className="muted text-block hero-text"
                as="p"
                text={resolveLocalizedText(selectedPage.heroText, language)}
                propertyId={property.id}
              />
            ) : null}
            <h2>{selectedPage ? resolveLocalizedText(selectedPage.title, language) : ""}</h2>
            {selectedPage?.sections.map((section) => (
              <div className="page-section" key={section.id} id={`section-${section.id}`}>
                {section.title ? <h4>{resolveLocalizedText(section.title, language)}</h4> : null}
                {(section.heroImages ?? []).length > 0 ? (
                  <HeroSlideshow
                    className="hero section-hero"
                    propertyId={property.id}
                    images={section.heroImages ?? []}
                    transitionStyle={property.heroSettings?.transition}
                  />
                ) : null}
                {section.heroText ? (
                  <RichText
                    className="muted text-block hero-text"
                    as="p"
                    text={resolveLocalizedText(section.heroText, language)}
                    propertyId={property.id}
                  />
                ) : null}
                {section.description ? (
                  <RichText
                    className="text-block"
                    as="p"
                    text={resolveLocalizedText(section.description, language)}
                    propertyId={property.id}
                  />
                ) : null}
                {section.images.length > 0 ? (
                  <div className="image-grid">
                    {section.images.map((image, index) => (
                      <figure key={image.src}>
                        <button
                          type="button"
                          className="image-grid-button"
                          onClick={() =>
                            openGallery(
                              section.images,
                              index,
                              resolveLocalizedText(section.title, language)
                                || resolveLocalizedText(selectedPage?.title ?? "", language)
                                || t("property.gallery")
                            )
                          }
                          aria-label={t("property.openImage")
                            .replace("{index}", String(index + 1))
                            .replace("{section}", resolveLocalizedText(section.title ?? "", language) || "section")}
                        >
                          <img
                            src={resolveImageUrl(property.id, image.src)}
                            alt={resolveLocalizedText(image.alt, language)}
                          />
                        </button>
                        <figcaption className="muted">{resolveLocalizedText(image.alt, language)}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </>
        )}
      </div>
      {isViewerOpen ? (
        <div className="image-viewer" role="dialog" aria-modal="true">
          <button
            type="button"
            className="image-viewer-shim"
            aria-label={t("property.closeViewer")}
            onClick={() => {
              setViewerImages([]);
              setViewerIndex(0);
              setViewerTitle("");
            }}
          />
          <div className="image-viewer-content">
            <button
              type="button"
              className="image-viewer-close"
              aria-label={t("property.closeViewer")}
              onClick={() => {
                setViewerImages([]);
                setViewerIndex(0);
                setViewerTitle("");
              }}
            >
              ×
            </button>
            <div className="image-viewer-header">
              <h4 className="image-viewer-title">{viewerTitle || t("property.gallery")}</h4>
            </div>
            <div className="image-viewer-body">
              <div className="image-viewer-thumbs" role="listbox" aria-label={t("property.sectionImages")}>
                {viewerImages.map((image, index) => {
                  const isActive = index === viewerIndex;
                  return (
                    <button
                      key={`${image.src}-${index}`}
                      type="button"
                      className={`image-viewer-thumb${isActive ? " active" : ""}`}
                      aria-label={t("property.openImage")
                        .replace("{index}", String(index + 1))
                        .replace("{section}", viewerTitle || t("property.gallery"))}
                      aria-selected={isActive}
                      onClick={() => setViewerIndex(index)}
                    >
                      <img
                        src={resolveImageUrl(property.id, image.src)}
                        alt={resolveLocalizedText(image.alt, language)}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="image-viewer-main">
                <img
                  src={resolveImageUrl(property.id, viewerImages[viewerIndex]?.src ?? "")}
                  alt={resolveLocalizedText(viewerImages[viewerIndex]?.alt ?? "", language)}
                />
                {viewerImages[viewerIndex]?.alt ? (
                  <p className="image-viewer-caption">
                    {resolveLocalizedText(viewerImages[viewerIndex]?.alt ?? "", language)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
