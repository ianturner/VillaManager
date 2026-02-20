import type { PropertyDto } from "@/lib/types";

const DEFAULT_BASE_URL = "http://localhost:5106";

/**
 * Returns the API base URL. When running locally (NODE_ENV=development),
 * uses the local API (localhost:5106) unless NEXT_PUBLIC_API_BASE_URL
 * explicitly points to a localhost URL. This ensures local testing uses
 * the local API even if .env contains a production URL.
 */
export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (process.env.NODE_ENV === "development") {
    if (!configured) return DEFAULT_BASE_URL;
    try {
      const url = new URL(configured);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return configured;
      }
    } catch {
      /* ignore invalid URL */
    }
    return DEFAULT_BASE_URL;
  }
  return configured ?? DEFAULT_BASE_URL;
}

export function resolveImageUrl(propertyId: string, src: string) {
  if (!src) {
    return src;
  }

  const baseUrl = getApiBaseUrl();
  const isAbsolute = src.startsWith("http://") || src.startsWith("https://");

  if (isAbsolute) {
    try {
      const url = new URL(src);
      if (url.origin === baseUrl && propertyId) {
        if (url.pathname.startsWith("/data/properties/")) {
          return src;
        }
        // Rewrite same-origin URLs that don't include the property path (e.g. API
        // returned /images/... or /pages/...) so they point at this property's assets.
        if (url.pathname.startsWith("/data/")) {
          return src;
        }
        const path = url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`;
        return `${baseUrl}/data/properties/${propertyId}${path}`;
      }
    } catch {
      return src;
    }

    return src;
  }

  const path = src.startsWith("/") ? src : `/${src}`;
  if (path.startsWith("/data/")) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/data/properties/${propertyId}${path}`;
}

export async function getProperty(id: string, lang?: string): Promise<PropertyDto> {
  const baseUrl = getApiBaseUrl();
  const searchParams = new URLSearchParams();
  if (lang) {
    searchParams.set("lang", lang);
  }
  const suffix = searchParams.toString();
  const response = await fetch(`${baseUrl}/api/properties/${id}${suffix ? `?${suffix}` : ""}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to load property ${id}`);
  }

  return response.json();
}

export async function tryGetProperty(id: string, lang?: string): Promise<PropertyDto | null> {
  try {
    return await getProperty(id, lang);
  } catch {
    return null;
  }
}
