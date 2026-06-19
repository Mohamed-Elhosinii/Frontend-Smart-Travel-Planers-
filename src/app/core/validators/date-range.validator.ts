import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Group validator: ensures `returnDate` is on or after `departureDate`.
 * Returns `{ dateInvalid: true }` when the return date precedes departure.
 */
export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const departureDate = group.get('departureDate')?.value;
  const returnDate = group.get('returnDate')?.value;

  if (!departureDate || !returnDate) {
    return null;
  }

  const from = new Date(departureDate);
  const to = new Date(returnDate);

  return to < from ? { dateInvalid: true } : null;
}
