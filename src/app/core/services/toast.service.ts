import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'danger';

export interface Toast {
  type: ToastType;
  message: string;
}

const DEFAULT_DURATION_MS = 4000;

/**
 * App-wide toast/alert state. A single toast is shown at a time and auto-dismisses.
 * Consumed by the shared `<app-toast>` component; raised from anywhere via DI.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _current = signal<Toast | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  /** The currently displayed toast, or `null`. */
  readonly current = this._current.asReadonly();

  success(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show({ type: 'success', message }, durationMs);
  }

  danger(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show({ type: 'danger', message }, durationMs);
  }

  show(toast: Toast, durationMs = DEFAULT_DURATION_MS): void {
    clearTimeout(this.timer);
    this._current.set(toast);
    this.timer = setTimeout(() => this.clear(), durationMs);
  }

  clear(): void {
    clearTimeout(this.timer);
    this._current.set(null);
  }
}
