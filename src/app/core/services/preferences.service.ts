import { Injectable, signal } from '@angular/core';
import { NotificationPreferences } from '../models';

const PREFERENCES_KEY = 'stp_preferences';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailTripReminders: true,
  emailMarketing: false,
  pushTravelAlerts: true,
  smsImportantUpdates: false,
};

/**
 * Owns the user's notification preferences, persisted to `localStorage`.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly _preferences = signal<NotificationPreferences>(this.restore());

  /** Current notification preferences (read-only signal). */
  readonly preferences = this._preferences.asReadonly();

  /** Persist a full preferences update. */
  update(preferences: NotificationPreferences): void {
    const next = { ...preferences };
    this._preferences.set(next);
    this.persist(next);
  }

  private restore(): NotificationPreferences {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  private persist(preferences: NotificationPreferences): void {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }
}
