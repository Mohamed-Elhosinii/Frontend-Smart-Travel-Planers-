import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Group validator factory: ensures two password fields match.
 * Returns `{ passwordMismatch: true }` on the group when they differ.
 *
 * @param passwordKey  control name of the new password (default `password`)
 * @param confirmKey   control name of the confirmation (default `confirmPassword`)
 */
export function passwordMatchValidator(
  passwordKey = 'password',
  confirmKey = 'confirmPassword',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;

    if (!password || !confirm) {
      return null;
    }
    return password === confirm ? null : { passwordMismatch: true };
  };
}
