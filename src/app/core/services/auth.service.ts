import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

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
export interface ApiResponse<T = any> {
  succeeded: boolean;
  message: string;
  data?: T;
  errors: string[];
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
  fullName: string;
  email: string;
  emailConfirmed: boolean;
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

const API_BASE = `${environment.apiUrl}/Auth`;
const SESSION_KEY = 'stp_session_email';
const PROFILE_KEY = 'stp_profile';

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
    // Computed reacts to _email changes (login/logout)
    const email = this._email();
    if (!email) return false;
    const token = this.getToken();
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return false;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return role === 'Admin';
    } catch (e) {
      console.error('Failed to parse role from token:', e);
      return false;
    }
  });

  // -----------------------------------------------------------------------
  // Token helpers
  // -----------------------------------------------------------------------

  /** Retrieves the active JWT access token from localStorage. */
  getToken(): string | null {
    return this.safeGet('token');
  }

  /** Retrieves the stored refresh token from localStorage. */
  getRefreshToken(): string | null {
    return this.safeGet('refreshToken');
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

    return this.http.post<ApiResponse<AuthResponseDto>>(`${API_BASE}/login`, loginPayload).pipe(
      map(response => {
        const data = response?.data;
        const token = data?.accessToken;
        if (response?.succeeded && token && data) {
          localStorage.setItem('token', token);
          this.safeSet('refreshToken', data.refreshToken);
          this.persistSession(data.email ?? credentials.email.trim());
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

  register(data: RegistrationData): Observable<string | null> {
    if (!data.email.trim() || !data.password) {
      return of(null);
    }

    const payload = {
      fullName: data.fullName,
      email: data.email.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
    };

    return this.http.post<ApiResponse<string>>(`${API_BASE}/register`, payload).pipe(
      map(response => {
        if (response?.succeeded && response.data) {
          return response.data; // this is the userId
        }
        return null;
      }),
      catchError(err => {
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

    return this.http.post<ApiResponse<AuthResponseDto>>(`${API_BASE}/refresh-token`, JSON.stringify(refreshToken), {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    }).pipe(
      map(response => {
        const data = response?.data;
        const token = data?.accessToken;
        if (response?.succeeded && token && data) {
          localStorage.setItem('token', token);
          this.safeSet('refreshToken', data.refreshToken);
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.error('Token refresh failed:', err);
        throw err;
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
      this.http.post(`${API_BASE}/logout`, JSON.stringify(refreshToken), { headers }).pipe(
        catchError(() => of(null)),
      ).subscribe();
    }

    // Immediate client-side cleanup regardless of server response
    this._email.set(null);
    localStorage.removeItem('token');
    this.safeRemove('refreshToken');
    this.safeRemove(SESSION_KEY);
    this.safeRemove(PROFILE_KEY);
    this.router.navigate(['/login']);
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/forgot-password
  // -----------------------------------------------------------------------

  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/forgot-password`, { email }).pipe(
      catchError(err => {
        console.error('Forgot password request failed:', err);
        return of({
          succeeded: false,
          message: 'If this email exists, a reset link has been sent.',
          errors: [err.message || 'Error occurred']
        } as ApiResponse);
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/reset-password
  // -----------------------------------------------------------------------

  resetPassword(dto: ResetPasswordDto): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/reset-password`, dto).pipe(
      catchError(err => {
        console.error('Reset password failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/confirm-email
  // -----------------------------------------------------------------------

  confirmEmail(dto: ConfirmEmailDto): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/confirm-email`, dto).pipe(
      catchError(err => {
        console.error('Email confirmation failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // POST /api/Auth/resend-confirm-email
  // -----------------------------------------------------------------------

  resendConfirmEmail(userId: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/resend-confirm-email`, { userId, token: '' }).pipe(
      catchError(err => {
        console.error('Resend confirmation email failed:', err);
        throw err;
      }),
    );
  }

  // -----------------------------------------------------------------------
  // GET /api/Auth/me  (requires Bearer token)
  // -----------------------------------------------------------------------

  getCurrentUser(): Observable<UserProfileDto | null> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<UserProfileDto>>(`${API_BASE}/me`, { headers }).pipe(
      map(response => {
        if (response?.succeeded && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(err => {
        console.error('Failed to fetch current user:', err);
        return of(null);
      }),
    );
  }

  // -----------------------------------------------------------------------
  // GET /api/Auth/google-login  (initiates OAuth 302 redirect)
  // -----------------------------------------------------------------------

  initiateGoogleLogin(): void {
    window.location.href = `${API_BASE}/google-login`;
  }

  /**
   * Handles the Google OAuth callback by persisting tokens returned as
   * query parameters and updating the reactive auth state.
   */
  handleGoogleCallback(accessToken: string, refreshToken: string, email?: string): void {
    localStorage.setItem('token', accessToken);
    this.safeSet('refreshToken', refreshToken);
    if (email) {
      this.persistSession(email);
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private persistSession(email: string): void {
    this._email.set(email);
    this.safeSet(SESSION_KEY, email);
  }

  private restoreSession(): string | null {
    return this.safeGet(SESSION_KEY);
  }

  // --- localStorage helpers (guarded for SSR / privacy-mode failures) ---
  private safeGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private safeSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — session is in-memory only */
    }
  }
  private safeRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
  }
}
