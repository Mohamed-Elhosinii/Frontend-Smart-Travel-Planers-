import { FormControl } from '@angular/forms';
import { emailValidator } from './email.validator';

describe('emailValidator', () => {
  it('passes for an empty value (required handles emptiness)', () => {
    expect(emailValidator(new FormControl(''))).toBeNull();
  });

  it('passes for a well-formed email', () => {
    expect(emailValidator(new FormControl('user@example.com'))).toBeNull();
  });

  it('fails for a malformed email', () => {
    expect(emailValidator(new FormControl('not-an-email'))).toEqual({ email: true });
  });
});
