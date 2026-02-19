export type ImageDto = {
  src: string;
  alt?: string | LocalizedString | null;
};

export type LocalizedString = Record<string, string>;

export type PropertyLinkDto = {
  url: string;
  label?: string | LocalizedString | null;
};

export type PropertyPlacesSectionDto = {
  id: string;
  title: string | LocalizedString;
  description?: string | LocalizedString | null;
  icon?: string | null;
  color?: string | null;
  categoryValue: string;
};

export type PropertyPlacesPageDto = {
  pageTitle: string | LocalizedString;
  description?: string | LocalizedString | null;
  sections?: PropertyPlacesSectionDto[] | null;
  items: PropertyExperienceItemDto[];
};
export type PropertyExperienceItemDto = {
  category?: string | LocalizedString | null;
  heading?: string | LocalizedString | null;
  heroImages?: ImageDto[] | null;
  itemText?: string | LocalizedString | null;
  galleryImages?: ImageDto[] | null;
  distance?: number | null;
  mapReference?: string | null;
  links?: PropertyLinkDto[] | null;
};

export type RentalAvailabilityDto = {
  year: number;
  calendarImage?: ImageDto | null;
};

export type RentalRateDto = {
  season: string;
  pricePerWeek?: string | null;
};

export type RentalBookingDto = {
  from?: string | null;
  to?: string | null;
  nights?: string | null;
  names?: string | null;
  source?: string | null;
  dateOfBooking?: string | null;
  bookingId?: string | null;
  repeatVisit?: string | null;
  preferredLanguage?: string | null;
  hasArrived?: string | null;
  vipGuest?: string | null;
  cleanDate?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  airport?: string | null;
  flightNumber?: string | null;
  arrivalTime?: string | null;
  departureTime?: string | null;
  adults?: string | null;
  children?: string | null;
  childrenAges?: string | null;
  cotRequired?: string | null;
  incomeEur?: string | null;
  exchangeRateEurGbp?: string | null;
  eurPerNight?: string | null;
  incomeGbp?: string | null;
  gbpPerNight?: string | null;
  dateRegisteredWithAade?: string | null;
  aadeScreenshot?: string | null;
  comments?: string | null;
};

export type RentalDto = {
  /** Optional display name for this unit (e.g. "Studio", "Apartment A"). Used when property has multiple units. */
  name?: string | null;
  /** Optional stable id for this unit. Used when property has multiple units. */
  id?: string | null;
  availability: RentalAvailabilityDto[];
  bookings: RentalBookingDto[];
  icalUrl?: string | null;
  rates: RentalRateDto[];
  conditions: string[];
};

export type GuestEquipmentInstructionDto = {
  id: string;
  name: string | LocalizedString;
  instructions?: string | LocalizedString | null;
  pdfId?: string | null;
};

export type GuestEmergencyContactDto = {
  category: string;
  name?: string | LocalizedString | null;
  phone?: string | null;
  notes?: string | LocalizedString | null;
  /** Optional images (first used for text wrap; multiple supported). Backward compat: fallback to image if present. */
  images?: ImageDto[] | null;
  /** @deprecated Use images. Kept for backward compatibility when API returns old shape. */
  image?: ImageDto | null;
  mapReference?: string | null;
  links?: PropertyLinkDto[] | null;
  /** Distance from property (e.g. km). Sorted closest first on guest page. */
  distance?: number | null;
};

export type GuestSafetyAdviceItemDto = {
  topic?: string | LocalizedString | null;
  notes?: string | LocalizedString | null;
};

export type GuestHealthAndSafetyDto = {
  emergencyContacts?: GuestEmergencyContactDto[] | null;
  safetyAdviceItems?: GuestSafetyAdviceItemDto[] | null;
};

export type GuestInfoDto = {
  wifiNetworkName?: string | null;
  wifiPassword?: string | null;
  wifiNotes?: string | LocalizedString | null;
  equipmentInstructions?: GuestEquipmentInstructionDto[] | null;
  healthAndSafety?: GuestHealthAndSafetyDto | null;
};

export type PropertySectionDto = {
  id: string;
  title?: string | LocalizedString | null;
  heroText?: string | LocalizedString | null;
  heroImages?: ImageDto[] | null;
  description?: string | LocalizedString | null;
  images: ImageDto[];
};

export type PropertyPageDto = {
  id: string;
  title: string | LocalizedString;
  showSectionsSubmenu?: string | null;
  heroImages?: ImageDto[] | null;
  heroText?: string | LocalizedString | null;
  sections: PropertySectionDto[];
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
  textShadow?: string;
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

export type ThemeDto = {
  name: string;
  defaultMode?: "light" | "dark";
  light: ThemePalette;
  dark: ThemePalette;
  fonts?: ThemeFonts | null;
  headingSizes?: ThemeHeadingSizes | null;
  headingTransforms?: ThemeHeadingTransforms | null;
  bodyTextSize?: string | null;
  cornerRadius?: string | null;
};

export type PropertyDto = {
  id: string;
  name: string | LocalizedString;
  archived?: boolean | null;
  status: string;
  version?: string | null;
  isPublished?: boolean | null;
  summary?: string | LocalizedString | null;
  heroImages?: ImageDto[] | null;
  heroSettings?: {
    transition?: "fade" | "slide" | "zoom" | "lift" | "pan";
  } | null;
  pages: PropertyPageDto[];
  places?: PropertyPlacesPageDto | null;
  theme?: ThemeDto | null;
  themeName?: string | null;
  externalLinks: PropertyLinkDto[];
  facts?: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    kitchens?: number | null;
    interiorAreaSqm?: number | null;
    landAreaSqm?: number | null;
  } | null;
  location?: {
    address: string | LocalizedString;
    mapEmbedUrl?: string | null;
    description?: string | LocalizedString | null;
  } | null;
  facilities: { title: string | LocalizedString; icon?: string | null; items: { text: string | LocalizedString }[] }[];
  pdfs: { id: string; title: string | LocalizedString; type: string; src: string }[];
  salesParticulars?: { price?: string | null; documents?: string[] | null } | null;
  /** Legacy single unit. When rentalUnits is null/empty, this is used as the single unit. */
  rental?: RentalDto | null;
  /** Rental units (each with own bookings, rates, conditions, ical). When null/empty, use rental as single unit. */
  rentalUnits?: RentalDto[] | null;
  guestInfo?: GuestInfoDto | null;
  /** Language codes this listing supports (e.g. en, fr, de, el). When null/empty, treat as all supported. */
  listingLanguages?: string[] | null;
};

/**
 * Returns the list of rental units for a property/draft. Uses rentalUnits when present,
 * otherwise treats rental as a single unit for backward compatibility.
 */
export function getRentalUnits(
  p: { rental?: RentalDto | null; rentalUnits?: RentalDto[] | null }
): RentalDto[] {
  if (p.rentalUnits?.length) return p.rentalUnits;
  if (p.rental) return [p.rental];
  return [];
}
