"use client";

// HeroSlideshow - cycles hero images with user controls.

import { useEffect, useMemo, useState } from "react";
import type { ImageDto } from "@/lib/types";
import { resolveImageUrl } from "@/lib/api";
import { resolveLocalizedText } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n/useLanguage";

const DEFAULT_INTERVAL_MS = 6000;

type HeroSlideshowProps = {
  propertyId: string;
  images: ImageDto[];
  className?: string;
  imageClassName?: string;
  overlay?: React.ReactNode;
  /** When set, a button is shown in the hero controls to open these images in the full image viewer (e.g. to view at proper aspect ratio). */
  onOpenInViewer?: () => void;
  openInViewerLabel?: string;
  intervalMs?: number;
  transitionStyle?: "fade" | "slide" | "zoom" | "lift" | "pan";
};

export default function HeroSlideshow({
  propertyId,
  images,
  className,
  imageClassName,
  overlay,
  onOpenInViewer,
  openInViewerLabel,
  intervalMs = DEFAULT_INTERVAL_MS,
  transitionStyle = "fade"
}: HeroSlideshowProps) {
  const { language, t } = useTranslations();
  const slides = useMemo(() => images.filter((image) => Boolean(image?.src)), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(slides.length > 1);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      setIsPlaying(false);
    }
  }, [slides.length]);

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, isPlaying, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const activeImage = slides[activeIndex];
  const containerClassName = [
    "hero-slideshow",
    `hero-transition-${transitionStyle}`,
    className
  ]
    .filter(Boolean)
    .join(" ");
  const showControls = slides.length > 1;
  const totalSlides = slides.length;

  return (
    <div className={containerClassName}>
      <img
        key={`${activeImage.src}-${activeIndex}`}
        className={imageClassName}
        src={resolveImageUrl(propertyId, activeImage.src)}
        alt={resolveLocalizedText(activeImage.alt, language)}
      />
      {overlay}
      {showControls || onOpenInViewer ? (
        <div className="hero-controls" role="group" aria-label={t("hero.controls")}>
          {onOpenInViewer ? (
            <button
              type="button"
              className="hero-open-viewer"
              aria-label={openInViewerLabel ?? t("hero.openInViewer")}
              title={openInViewerLabel ?? t("hero.openInViewer")}
              onClick={onOpenInViewer}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20">
                <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
              </svg>
            </button>
          ) : null}
          {showControls ? (
          <>
          {slides.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                type="button"
                key={`${image.src}-${index}`}
                className={`hero-dot${isActive ? " hero-dot-active" : ""}`}
                aria-label={t("hero.showImage")
                  .replace("{index}", String(index + 1))
                  .replace("{total}", String(totalSlides))}
                aria-current={isActive ? "true" : undefined}
                onClick={() => {
                  setActiveIndex(index);
                  setIsPlaying(false);
                }}
              />
            );
          })}
          <button
            type="button"
            className={`hero-play${isPlaying ? " hero-play-active" : ""}`}
            aria-label={isPlaying ? t("hero.pause") : t("hero.play")}
            aria-pressed={isPlaying}
            onClick={() => setIsPlaying((prev) => !prev)}
          >
            {isPlaying ? (
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4.5 3.2h2.3v9.6H4.5zM9.2 3.2h2.3v9.6H9.2z" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4 3.2v9.6c0 .5.5.8.9.5l7.2-4.8c.4-.3.4-.8 0-1.1L4.9 2.7c-.4-.3-.9 0-.9.5z" />
              </svg>
            )}
          </button>
          </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
