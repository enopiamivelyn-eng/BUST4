export function formatBookingReference(id: string, departureDate: string): string {
  return `BK-${departureDate.slice(0, 4)}-${id.slice(-8).toUpperCase()}`;
}
