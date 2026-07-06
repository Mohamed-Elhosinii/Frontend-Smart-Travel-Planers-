import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { emailValidator } from '../../../core/validators/email.validator';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';
import { passwordValidator, PASSWORD_RULE_HINT } from '../../../core/validators/password.validator';
import { extractErrorMessage } from '../../../core/utils/http-error';
import { APP_ROUTES } from '../../../core/constants/routes';
import { Logo } from '../../../shared/logo/logo';

/** Registration page backed by a reactive form with full client-side validation. */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Logo],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  submitted = false;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  /** Backend password policy, surfaced as a hint under the field. */
  readonly passwordHint = PASSWORD_RULE_HINT;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Rules mirror the backend RegisterDtoValidator: full name 3–50 chars,
  // email format, password complexity, and matching confirmation.
  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, emailValidator]],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') },
  );

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, email, password, confirmPassword } = this.form.getRawValue();
    this.isLoading = true;
    this.auth.register({ fullName, email, password, confirmPassword }).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result) {
          // Backend returns the new userId; hand it to the OTP confirmation step.
          this.router.navigate([APP_ROUTES.confirmEmail], { queryParams: { userId: result } });
        } else {
          this.errorMessage = 'Registration failed. The email may already be in use.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = extractErrorMessage(err, 'Registration failed. Please try again.');
      },
    });
  }

  /** Initiate real Google OAuth flow via the backend redirect. */
  continueWithGoogle(): void {
    this.auth.initiateGoogleLogin();
  }
}
