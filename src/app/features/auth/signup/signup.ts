import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { emailValidator } from '../../../core/validators/email.validator';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';

/** Registration page backed by a reactive form with full client-side validation. */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, emailValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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
      next: (userId) => {
        this.isLoading = false;
        if (userId) {
          this.router.navigate(['/confirm-email'], { queryParams: { userId } });
        } else {
          this.errorMessage = 'Registration failed. Please check your details.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        let errorData = err.error;
        if (typeof errorData === 'string') {
          try {
            errorData = JSON.parse(errorData);
          } catch {
            // Ignore parse failure
          }
        }
        if (errorData?.errors && errorData.errors.length > 0) {
          this.errorMessage = errorData.errors.join(' ');
        } else {
          this.errorMessage = errorData?.message || `Connection/Server Error (${err.status}: ${err.statusText || 'Server unreachable'}).`;
        }
      }
    });
  }

  /** Initiate real Google OAuth flow via the backend redirect. */
  continueWithGoogle(): void {
    this.auth.initiateGoogleLogin();
  }
}
