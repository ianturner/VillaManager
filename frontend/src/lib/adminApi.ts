import { getApiBaseUrl } from "@/lib/api";
import type { PropertyDto } from "@/lib/types";

export type AuthUserInfo = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  propertyIds: string[];
  preferredLanguage?: string | null;
};

export type AuthLoginResponse = {
  token: string;
  expiresAt: string;
  user: AuthUserInfo;
};

export type IcalAvailabilityRange = {
  start: string;
  end: string;
  summary?: string | null;
};

export type UserAdminDto = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  propertyIds: string[];
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  viber?: string | null;
  disabled: boolean;
  preferredLanguage?: string | null;
};

export type UserCreateRequest = {
  username: string;
  displayName: string;
  roles: string[];
  propertyIds: string[];
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  viber?: string | null;
  password: string;
  disabled?: boolean;
  preferredLanguage?: string | null;
};

export type UserUpdateRequest = {
  username?: string | null;
  displayName?: string | null;
  roles?: string[] | null;
  propertyIds?: string[] | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  viber?: string | null;
  password?: string | null;
  disabled?: boolean | null;
  preferredLanguage?: string | null;
};

export type UserPropertySummary = {
  id: string;
  name: string;
};

export type ThemePalette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
  border: string;
  shadow: string;
  textShadow?: string | null;
};

export type ThemeFont = {
  family: string;
  src?: string | null;
  format?: string | null;
  weight?: string | null;
  style?: string | null;
};

export type ThemeFonts = {
  base: ThemeFont;
  title: ThemeFont;
  subtitle: ThemeFont;
};

export type ThemeHeadingSizes = {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
};

export type ThemeHeadingTransforms = {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
};

export type ThemeLibrary = {
  name: string;
  displayName: string;
  isPrivate: boolean;
  createdBy?: string | null;
  defaultMode?: "light" | "dark" | null;
  light: ThemePalette;
  dark: ThemePalette;
  fonts?: ThemeFonts | null;
  headingSizes?: ThemeHeadingSizes | null;
  headingTransforms?: ThemeHeadingTransforms | null;
  bodyTextSize?: string | null;
  cornerRadius?: string | null;
};

export type ThemeCreateRequest = {
  name: string;
  displayName: string;
  isPrivate: boolean;
  defaultMode?: "light" | "dark" | null;
  light: ThemePalette;
  dark: ThemePalette;
  fonts?: ThemeFonts | null;
  headingSizes?: ThemeHeadingSizes | null;
  headingTransforms?: ThemeHeadingTransforms | null;
  bodyTextSize?: string | null;
  cornerRadius?: string | null;
};

export type ThemeUpdateRequest = {
  displayName?: string | null;
  isPrivate?: boolean | null;
  createdBy?: string | null;
  defaultMode?: "light" | "dark" | null;
  light?: ThemePalette | null;
  dark?: ThemePalette | null;
  fonts?: ThemeFonts | null;
  headingSizes?: ThemeHeadingSizes | null;
  headingTransforms?: ThemeHeadingTransforms | null;
  bodyTextSize?: string | null;
  cornerRadius?: string | null;
};

export class AuthError extends Error {
  constructor(message = "Session expired.") {
    super(message);
    this.name = "AuthError";
  }
}

export class PermissionError extends Error {
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "PermissionError";
  }
}

const TOKEN_KEY = "vm_admin_token";
const TOKEN_EXPIRES_KEY = "vm_admin_token_expires";
const USER_KEY = "vm_admin_user";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string, expiresAt?: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  if (expiresAt) {
    window.localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt);
  }
}

export function storeUser(user: AuthUserInfo) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeSession(response: AuthLoginResponse) {
  storeToken(response.token, response.expiresAt);
  storeUser(response.user);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredTokenExpiresAt() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_EXPIRES_KEY);
}

export function getStoredUser(): AuthUserInfo | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUserInfo;
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<AuthLoginResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error("Invalid username or password.");
  }

  return response.json();
}

export async function refreshSession(token: string): Promise<AuthLoginResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to refresh session.");
  }

  return response.json();
}

export async function getAdminProperties(
  token: string,
  options?: { includeAllLanguages?: boolean }
): Promise<PropertyDto[]> {
  const baseUrl = getApiBaseUrl();
  const searchParams = new URLSearchParams();
  if (options?.includeAllLanguages) {
    searchParams.set("includeAllLanguages", "true");
  }
  const suffix = searchParams.toString();
  const response = await fetch(`${baseUrl}/api/admin/properties${suffix ? `?${suffix}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to load properties.");
  }

  return response.json();
}

export async function createProperty(
  token: string,
  payload: { id: string; name: string; status: string; listingLanguages?: string[] }
) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/properties`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to create property.");
  }
}

export async function updateProperty(
  token: string,
  id: string,
  payload: Partial<PropertyDto> & { status?: string }
) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/properties/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to update property.");
  }
}

export type FlightLookupResponse = {
  arrivalTime?: string | null;
  raw?: string | null;
  flightNumber?: string | null;
  date?: string | null;
};

export async function lookupFlightArrival(
  token: string,
  params: { flightNumber: string; date?: string | null; airport?: string | null }
): Promise<FlightLookupResponse> {
  const baseUrl = getApiBaseUrl();
  const searchParams = new URLSearchParams();
  searchParams.set("flightNumber", params.flightNumber);
  if (params.date) {
    searchParams.set("date", params.date);
  }
  if (params.airport) {
    searchParams.set("airport", params.airport);
  }

  const response = await fetch(
    `${baseUrl}/api/admin/flights/lookup?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }
  if (response.status === 501) {
    throw new Error("Flight lookup is not configured.");
  }

  if (!response.ok) {
    let message = "Unable to look up flight arrival time.";
    const raw = await response.text();
    if (raw) {
      try {
        const errorPayload = JSON.parse(raw);
        if (errorPayload?.message) {
          message = errorPayload.message;
          if (errorPayload?.details) {
            message = `${message} ${errorPayload.details}`;
          }
          if (Array.isArray(errorPayload?.candidates) && errorPayload.candidates.length > 0) {
            message = `${message} Candidates: ${errorPayload.candidates.join(", ")}.`;
          }
          if (Array.isArray(errorPayload?.flightNumbers) && errorPayload.flightNumbers.length > 0) {
            message = `${message} Flights: ${errorPayload.flightNumbers.join(", ")}.`;
          }
        } else {
          message = raw;
        }
      } catch {
        message = raw;
      }
    }
    throw new Error(message);
  }

  return response.json();
}

export async function publishProperty(token: string, id: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/properties/${id}/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to publish property.");
  }
}

export async function revertProperty(token: string, id: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/properties/${id}/revert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to revert property.");
  }
}

export async function getAdminUsers(token: string): Promise<UserAdminDto[]> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to load users.");
  }

  return response.json();
}

export async function getAdminUserProperties(token: string): Promise<UserPropertySummary[]> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/users/properties`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to load properties.");
  }

  return response.json();
}

export async function createAdminUser(token: string, payload: UserCreateRequest): Promise<UserAdminDto> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to create user.");
  }

  return response.json();
}

export async function updateAdminUser(
  token: string,
  id: string,
  payload: UserUpdateRequest
): Promise<UserAdminDto> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to update user.");
  }

  return response.json();
}

export async function deleteAdminUser(token: string, id: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to delete user.");
  }
}

export async function getThemes(token: string): Promise<ThemeLibrary[]> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/themes`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new AuthError();
  }
  if (response.status === 403) {
    throw new PermissionError();
  }

  if (!response.ok) {
    throw new Error("Unable to load themes.");
  }

  return response.json();
}

export async function createTheme(token: string, payload: ThemeCreateRequest): Promise<ThemeLibrary> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/themes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new Error("Unable to create theme.");
  }

  return response.json();
}

export async function updateTheme(
  token: string,
  name: string,
  payload: ThemeUpdateRequest
): Promise<ThemeLibrary> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/themes/${name}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new Error("Unable to update theme.");
  }

  return response.json();
}

export async function deleteTheme(token: string, name: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/themes/${name}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new Error("Unable to delete theme.");
  }
}

export async function getIcalAvailability(
  token: string,
  id: string,
  unitIndex?: number
): Promise<IcalAvailabilityRange[]> {
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}/api/admin/properties/${id}/availability/ical`);
  if (unitIndex !== undefined && unitIndex > 0) {
    url.searchParams.set("unitIndex", String(unitIndex));
  }
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new Error("Unable to load iCal availability.");
  }

  return response.json();
}

export async function archiveProperty(token: string, id: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/properties/${id}/archive`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new Error("Unable to archive property.");
  }
}

export async function restoreProperty(token: string, id: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/properties/${id}/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new Error("Unable to restore property.");
  }
}
