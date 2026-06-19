import { AbstractControl, ValidationErrors } from '@angular/forms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Control validator for a syntactically valid email address.
 * Emptiness is left to `Validators.required` so this only flags bad formats.
 * Returns `{ email: true }` on failure.
 */
export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  return EMAIL_PATTERN.test(value) ? null : { email: true };
}
