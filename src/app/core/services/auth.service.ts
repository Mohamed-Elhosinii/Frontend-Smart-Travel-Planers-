import { Injectable, computed, signal } from '@angular/core';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
}

export interface GoogleProfile {
  fullName: string;
  email: string;
}

const SESSION_KEY = 'stp_session_email';

/** Stand-in Google account used until real Google Identity Services is wired in. */
const DEMO_GOOGLE_ACCOUNT: GoogleProfile = {
  fullName: 'Google User',
  email: 'demo.user@gmail.com',
};

/**
 * Mock authentication.
 *
 * There is no backend, so a "session" is just the signed-in email persisted to
 * `localStorage`. Replace {@link login}/{@link register} with real HTTP calls
 * (returning a token) without changing the public signal surface.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _email = signal<string | null>(this.restoreSession());

  /** The signed-in user's email, or `null` when logged out. */
  readonly currentEmail = this._email.asReadonly();

  /** Whether a user is currently signed in. */
  readonly isLoggedIn = computed(() => this._email() !== null);

  /** Mock sign-in: succeeds for any non-empty, well-formed credentials. */
  login(credentials: Credentials): boolean {
    if (!credentials.email.trim() || !credentials.password) {
      return false;
    }
    this.persistSession(credentials.email.trim());
    return true;
  }

  /** Mock registration: persists a session for the new account. */
  register(data: RegistrationData): boolean {
    if (!data.email.trim() || !data.password) {
      return false;
    }
    this.persistSession(data.email.trim());
    return true;
  }

  /**
   * Mock "Continue with Google". With no backend there is no real OAuth flow, so
   * this registers a demo Google account and persists a session.
   *
   * To make it real: load Google Identity Services (https://accounts.google.com/gsi/client),
   * render the button with your OAuth Client ID, then in the credential callback
   * decode the returned JWT (name + email) and pass it here as `googleProfile`.
   */
  signInWithGoogle(googleProfile: GoogleProfile = DEMO_GOOGLE_ACCOUNT): boolean {
    return this.register({
      fullName: googleProfile.fullName,
      email: googleProfile.email,
      password: 'google-oauth',
    });
  }

  logout(): void {
    this._email.set(null);
    this.safeRemove(SESSION_KEY);
  }

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
