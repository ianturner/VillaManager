"use client";

import { useEffect } from "react";

type PropertyStyleLinkProps = {
  propertyId: string;
  themeName?: string | null;
};

export default function PropertyStyleLink({ propertyId, themeName }: PropertyStyleLinkProps) {
  useEffect(() => {
    const id = "property-style-link";
    const resolvedName = themeName || propertyId;
    const href = `/property-styles/${resolvedName}.css`;
    let link = document.querySelector<HTMLLinkElement>(`#${id}`);

    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    link.href = href;

    return () => {
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [propertyId, themeName]);

  return null;
}
