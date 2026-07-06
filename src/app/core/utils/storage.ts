/**
 * Safe localStorage wrapper — swallows failures (private mode / SSR / quota) so
 * callers never need their own try/catch. Replaces the duplicated
 * `safeGet/safeSet/safeRemove` helpers that previously lived in multiple files.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — best effort only */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
  },
};
