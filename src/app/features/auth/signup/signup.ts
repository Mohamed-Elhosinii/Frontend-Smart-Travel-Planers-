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
    this.auth.register({ fullName, email, password, confirmPassword }).subscribe(success => {
      this.isLoading = false;
      if (success) {
        this.router.navigate(['/my-trips']);
      } else {
        this.errorMessage = 'Registration failed. The email may already be in use.';
      }
    });
  }

  /** Initiate real Google OAuth flow via the backend redirect. */
  continueWithGoogle(): void {
    this.auth.initiateGoogleLogin();
  }
}
