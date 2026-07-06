import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Mirrors the backend password rules (RegisterDtoValidator / ResetPasswordDtoValidator):
 * at least 6 characters and at least one uppercase letter, one lowercase letter,
 * one digit, and one special (non-alphanumeric) character.
 *
 * Emptiness is left to `Validators.required`. On failure returns
 * `{ passwordStrength: { minLength, upper, lower, digit, special } }` where each
 * flag is `true` when that specific requirement is unmet — so the UI can show a
 * live checklist.
 */
export function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) {
    return null;
  }

  const failures = {
    minLength: value.length < 6,
    upper: !/[A-Z]/.test(value),
    lower: !/[a-z]/.test(value),
    digit: !/[0-9]/.test(value),
    special: !/[^a-zA-Z0-9]/.test(value),
  };

  const hasFailure = Object.values(failures).some(Boolean);
  return hasFailure ? { passwordStrength: failures } : null;
}

/** One-line human-readable summary of the backend password policy. */
export const PASSWORD_RULE_HINT =
  'At least 6 characters with an uppercase letter, a lowercase letter, a number, and a special character.';
