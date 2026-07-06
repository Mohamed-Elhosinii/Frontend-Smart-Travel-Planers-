import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ENDPOINTS } from '../config/endpoints';
import { STORAGE_KEYS } from '../constants/storage';
import { APP_ROUTES } from '../constants/routes';
import { MESSAGES } from '../constants/messages';
import { storage } from '../utils/storage';

// ---------------------------------------------------------------------------
// DTOs aligned with .NET backend
// ---------------------------------------------------------------------------

/** Maps to backend LoginDto */
export interface Credentials {
  email: string;
  password: string;
}

/** Maps to backend RegisterDto */
export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Maps to backend AuthResponseDto */
export interface AuthResponseDto {
  userId: string;
  fullName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
}

/** Maps to backend UserProfileDto (GET /api/Auth/me) */
export interface UserProfileDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber?: string;
  country?: string;
  currentPlan?: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
}

/** Maps to backend ForgotPasswordDto */
export interface ForgotPasswordDto {
  email: string;
}

/** Maps to backend ResetPasswordDto */
export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** Maps to backend ConfirmEmailDto (query params) */
export interface ConfirmEmailDto {
  userId: string;
  token: string;
}

/** Decoded JWT payload claims the app reads (subset of the token). */
interface JwtPayload {
  exp?: number;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  [claim: string]: unknown;
}

/** Base64url-decodes and parses a JWT payload; returns `null` if malformed. */
function decodeJwt(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Authentication service wired to the .NET backend Auth endpoints.
 *
 * All AuthResponseDto properties are read with camelCase to match the
 * JSON serialisation produced by System.Text.Json / Newtonsoft defaults.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly _email = signal<string | null>(this.restoreSession());

  /** The signed-in user's email, or `null` when logged out. */
  readonly currentEmail = this._email.asReadonly();

  /** Whether a user is currently signed in. */
  readonly isLoggedIn = computed(() => this._email() !== null);

  /** Whether the signed-in user has the Admin role. */
  readonly isAdmin = computed(() => {
    // Computed reacts to _email changes (login/logout).
    if (!this._email()) return false;
    const payload = decodeJwt(this.getToken());
    if (!payload) return false;
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return Array.isArray(role) ? role.includes('Admin') : role === 'Admin';
  });

  /**
   * True when there is no access token, it is malformed, or its `exp` claim is
   * in the past (with a small clock-skew allowance). Note: this is a UX gate
   * only — real authorization is always enforced by the backend.
   */
  isTokenExpired(): boolean {
    const payload = decodeJwt(this.getToken());
    if (!payload?.exp) return true;
    const skewSeconds = 10;
    return payload.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
  }

  // -----------------------------------------------------------------------
  // Token helpers
  // -----------------------------------------------------------------------

  /** Retrieves the active JWT access token from localStorage. */
  getToken(): string | null {
    return storage.get(STORAGE_KEYS.token);
  }

  /** Retrieves the stored refresh token from localStorage. */
  getRefreshToken(): string | null {
    return storage.get(STORAGE_KEYS.refreshToken);
  }

  /** Build an Authorization header set for authenticated requests. */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token && token.trim() !== '') {
      headers = headers.set('Authorization', `Bearer ${token.trim()}`);
    }
    return headers;
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/login
  // -----------------------------------------------------------------------

  login(credentials: Credentials): Observable<boolean> {
    if (!credentials.email.trim() || !credentials.password) {
      return of(false);
    }

    const loginPayload = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    return this.http.post<{ data: AuthResponseDto }>(ENDPOINTS.auth.login, loginPayload).pipe(
      map(response => {
        const token = response?.data?.accessToken;
        if (response && response.data && token) {
          storage.set(STORAGE_KEYS.token, token);
          storage.set(STORAGE_KEYS.refreshToken, response.data.refreshToken);
          this.persistSession(response.data.email ?? credentials.email.trim());
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.error('Login failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/register
  // -----------------------------------------------------------------------

  register(data: RegistrationData): Observable<string | boolean> {
    if (!data.email.trim() || !data.password) {
      return of(false);
    }

    const payload = {
      fullName: data.fullName,
      email: data.email.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
    };

    return this.http.post<{ data: string }>(ENDPOINTS.auth.register, payload).pipe(
      map(response => {
        if (response && response.data) {
          return response.data;
        }
        return false;
      }),
      catchError(err => {
        // Re-throw so the component can surface the real backend message
        // (e.g. "Email already exists" or validation errors).
        console.error('Registration failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/refresh-token
  // -----------------------------------------------------------------------

  refreshAccessToken(): Observable<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(false);
    }

    return this.http.post<{ data: AuthResponseDto }>(ENDPOINTS.auth.refreshToken, JSON.stringify(refreshToken), {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    }).pipe(
      map(response => {
        const token = response?.data?.accessToken;
        if (response && response.data && token) {
          storage.set(STORAGE_KEYS.token, token);
          storage.set(STORAGE_KEYS.refreshToken, response.data.refreshToken);
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.error('Token refresh failed:', err);
        return of(false);
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/logout
  // -----------------------------------------------------------------------

  logout(): void {
    const refreshToken = this.getRefreshToken();
    const headers = this.getAuthHeaders();

    // Fire-and-forget the server-side logout to revoke the refresh token
    if (refreshToken) {
      this.http.post(ENDPOINTS.auth.logout, JSON.stringify(refreshToken), { headers }).pipe(
        catchError(() => of(null)),
      ).subscribe();
    }

    // Immediate client-side cleanup regardless of server response
    this._email.set(null);
<<<<<<< Updated upstream
    localStorage.removeItem('token');
    this.safeRemove('refreshToken');
    this.safeRemove(SESSION_KEY);
    this.safeRemove(PROFILE_KEY);
    this.safeRemove('userTripIds');
    this.router.navigate(['/login']);
=======
    storage.remove(STORAGE_KEYS.token);
    storage.remove(STORAGE_KEYS.refreshToken);
    storage.remove(STORAGE_KEYS.sessionEmail);
    storage.remove(STORAGE_KEYS.profile);
    this.router.navigate([APP_ROUTES.login]);
>>>>>>> Stashed changes
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/forgot-password
  // -----------------------------------------------------------------------

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(ENDPOINTS.auth.forgotPassword, { email }).pipe(
      catchError(err => {
        console.error('Forgot password request failed:', err);
        return of({ message: MESSAGES.resetSuccess });
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/reset-password
  // -----------------------------------------------------------------------

  resetPassword(dto: ResetPasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(ENDPOINTS.auth.resetPassword, dto).pipe(
      catchError(err => {
        console.error('Reset password failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // GET /api/Auth/confirm-email  (query params: userId & token)
  // -----------------------------------------------------------------------

  confirmEmail(dto: ConfirmEmailDto): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(ENDPOINTS.auth.confirmEmail, {
      params: { userId: dto.userId, token: dto.token },
    }).pipe(
      catchError(err => {
        console.error('Email confirmation failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/resend-confirm-email
  // -----------------------------------------------------------------------

  resendConfirmEmail(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(ENDPOINTS.auth.resendConfirmEmail, {}, {
      params: { userId },
    }).pipe(
      catchError(err => {
        console.error('Resend email failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // GET /api/Auth/me  (requires Bearer token)
  // -----------------------------------------------------------------------

  getCurrentUser(): Observable<UserProfileDto | null> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ data: UserProfileDto }>(ENDPOINTS.auth.me, { headers }).pipe(
      map(response => response?.data || null),
      catchError(err => {
        console.error('Failed to fetch current user:', err);
        return of(null);
      }),
    );
  }

  updateProfile(dto: UpdateProfileDto): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.put(ENDPOINTS.auth.me, dto, { headers }).pipe(
      map(() => true),
      catchError(err => {
        console.error('Failed to update profile:', err);
        return of(false);
      }),
    );
  }

  // -----------------------------------------------------------------------
  // GET /api/Auth/google-login  (initiates OAuth 302 redirect)
  // -----------------------------------------------------------------------

  initiateGoogleLogin(): void {
    window.location.href = ENDPOINTS.auth.googleLogin;
  }

  /**
   * Handles the Google OAuth callback by persisting tokens returned as
   * query parameters and updating the reactive auth state.
   */
  handleGoogleCallback(accessToken: string, refreshToken: string, email?: string): void {
    storage.set(STORAGE_KEYS.token, accessToken);
    storage.set(STORAGE_KEYS.refreshToken, refreshToken);
    if (email) {
      this.persistSession(email);
    }
  }

  /** Publicly set the signed-in email (used by the OAuth callback after /me). */
  setSessionEmail(email: string): void {
    this.persistSession(email);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private persistSession(email: string): void {
    this._email.set(email);
    storage.set(STORAGE_KEYS.sessionEmail, email);
  }

  private restoreSession(): string | null {
    return storage.get(STORAGE_KEYS.sessionEmail);
  }
}
