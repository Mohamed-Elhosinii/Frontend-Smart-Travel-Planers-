import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  // Validation getters
  get fullNameError(): string {
    if (!this.submitted) return '';
    if (!this.fullName.trim()) return 'Full name is required.';
    if (this.fullName.trim().length < 3) return 'Name must be at least 3 characters.';
    return '';
  }

  get emailError(): string {
    if (!this.submitted) return '';
    if (!this.email) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) return 'Please enter a valid email.';
    return '';
  }

  get passwordError(): string {
    if (!this.submitted) return '';
    if (!this.password) return 'Password is required.';
    if (this.password.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(this.password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(this.password)) return 'Password must contain at least one number.';
    return '';
  }

  get confirmPasswordError(): string {
    if (!this.submitted) return '';
    if (!this.confirmPassword) return 'Please confirm your password.';
    if (this.confirmPassword !== this.password) return 'Passwords do not match.';
    return '';
  }

  get isFormValid(): boolean {
    return !this.fullNameError && !this.emailError && 
           !this.passwordError && !this.confirmPasswordError;
  }

  onSignup() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid) return;

    this.isLoading = true;

    this.authService.register({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created! Please check your email to confirm.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}