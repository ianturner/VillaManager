import type { PropertyDto } from "@/lib/types";

const normalizeToken = (value?: string | null) => (value ?? "").trim().toLowerCase();
const normalizeDateToken = (value?: string | null) =>
  normalizeToken(value).replace(/[^0-9]/g, "");

/**
 * Finds a booking that matches the guest link tokens (bookingId + bookingDate).
 */
export function findGuestBooking(
  property: PropertyDto | null,
  bookingId?: string | null,
  bookingDate?: string | null
) {
  const bookings = property?.rental?.bookings ?? [];
  if (bookings.length === 0) {
    return null;
  }
  const idToken = normalizeToken(bookingId);
  const dateToken = normalizeDateToken(bookingDate);
  if (!idToken || !dateToken) {
    return null;
  }
  return (
    bookings.find(
      (booking) =>
        normalizeToken(booking.bookingId) === idToken &&
        normalizeDateToken(booking.dateOfBooking) === dateToken
    ) ?? null
  );
}
