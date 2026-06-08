import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const departureDate = group.get('departureDate')?.value;
  const returnDate = group.get('returnDate')?.value;

  if (!departureDate || !returnDate) return null;

  const from = new Date(departureDate);
  const to = new Date(returnDate);

  if (to < from) {
    return { dateInvalid: true };
  }

  return null;
}
