/** Canonical booking states, plus aliases retained for pre-migration rows. */
export const APPROVED_BOOKING_STATUSES = ['approved', 'confirmed'] as const;
export const COMPLETED_BOOKING_STATUSES = ['complete', 'completed'] as const;

export function isApprovedBookingStatus(status: string): boolean {
  return (APPROVED_BOOKING_STATUSES as readonly string[]).includes(status);
}

export function isCompletedBookingStatus(status: string): boolean {
  return (COMPLETED_BOOKING_STATUSES as readonly string[]).includes(status);
}

export function displayBookingStatus(status: string): string {
  if (isApprovedBookingStatus(status)) return 'Approved';
  if (isCompletedBookingStatus(status)) return 'Complete';
  if (status === 'rejected') return 'Rejected';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
