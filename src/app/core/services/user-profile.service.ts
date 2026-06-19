import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../models';

const PROFILE_KEY = 'stp_profile';

const DEFAULT_PROFILE: UserProfile = {
  firstName: 'Mohamed',
  lastName: 'Elhosinii',
  email: 'mohamed@example.com',
  phone: '+20 123 456 7890',
  country: 'Egypt',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
};

/**
 * Owns the signed-in user's profile. Reads/writes `localStorage` so edits
 * survive a refresh while there is no backend.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly _profile = signal<UserProfile>(this.restore());

  /** The current profile (read-only signal). */
  readonly profile = this._profile.asReadonly();

  /** Persist a full profile update. */
  update(profile: UserProfile): void {
    const next = { ...profile };
    this._profile.set(next);
    this.persist(next);
  }

  private restore(): UserProfile {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  private persist(profile: UserProfile): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }
}
