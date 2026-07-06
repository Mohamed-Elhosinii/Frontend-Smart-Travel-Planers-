import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';

/**
 * Reusable centered modal dialog.
 *
 * Renders projected content inside a white card overlaid on a dimmed backdrop.
 * Closes on backdrop click, the close button, or the Escape key. Purely
 * presentational — the parent owns the `open` state and reacts to `closed`.
 *
 * Accessibility: on open, focus moves into the dialog; Tab is trapped within the
 * card; on close, focus returns to the element that opened it. The dialog is
 * labelled by its title (or a generic label when title-less).
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocused: HTMLElement | null = null;
  private _open = false;

  /** Whether the dialog is visible. Toggling also locks background scroll. */
  @Input()
  set open(value: boolean) {
    if (value === this._open) return;
    this._open = value;
    document.body.classList.toggle('modal-open-lock', value);

    if (value) {
      this.previouslyFocused = document.activeElement as HTMLElement | null;
      // Focus after the @if renders the card on the next tick.
      setTimeout(() => this.focusFirst(), 0);
    } else {
      this.restoreFocus();
    }
  }
  get open(): boolean {
    return this._open;
  }

  /** Optional heading rendered at the top of the card. */
  @Input() title = '';

  /** Optional sub-heading rendered under the title. */
  @Input() subtitle = '';

  /** Emitted whenever the user dismisses the dialog. */
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this._open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;

    // Focus trap: keep Tab / Shift+Tab cycling within the dialog's focusables.
    const focusables = this.getFocusable();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!active || !this.host.nativeElement.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  close(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    // Never leave the page scroll-locked if the modal is torn down while open.
    document.body.classList.remove('modal-open-lock');
    this.restoreFocus();
  }

  private getFocusable(): HTMLElement[] {
    const card = this.host.nativeElement.querySelector('.modal-card');
    if (!card) return [];
    const selector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(card.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }

  private focusFirst(): void {
    const focusables = this.getFocusable();
    const target =
      focusables[0] ??
      this.host.nativeElement.querySelector<HTMLElement>('.modal-close');
    target?.focus();
  }

  private restoreFocus(): void {
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }
}
