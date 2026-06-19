import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Password-reset request page. Shows a confirmation once an email is submitted. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordPage {
  email = '';
  isSubmitted = false;
  errorMessage = '';

  sendResetLink(): void {
    const email = this.email.trim();
    if (!email || !EMAIL_PATTERN.test(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }
    this.errorMessage = '';
    this.isSubmitted = true;
    // No backend yet — a real implementation would POST to /auth/forgot-password here.
  }
}
