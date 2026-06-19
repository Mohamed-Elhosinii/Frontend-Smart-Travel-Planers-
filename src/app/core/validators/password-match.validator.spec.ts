import { FormControl, FormGroup } from '@angular/forms';
import { passwordMatchValidator } from './password-match.validator';

describe('passwordMatchValidator', () => {
  const group = (password: string, confirm: string) =>
    new FormGroup(
      { password: new FormControl(password), confirmPassword: new FormControl(confirm) },
      { validators: passwordMatchValidator() },
    );

  it('passes when both passwords match', () => {
    expect(group('abc12345', 'abc12345').errors).toBeNull();
  });

  it('fails when the passwords differ', () => {
    expect(group('abc12345', 'different').errors).toEqual({ passwordMismatch: true });
  });

  it('does not flag until both fields are filled', () => {
    expect(group('abc12345', '').errors).toBeNull();
  });
});
