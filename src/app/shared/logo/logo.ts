import { Component, Input } from '@angular/core';

/**
 * Vantio brand logo — a gradient "V" mark plus the wordmark.
 *
 * The mark carries its own brand gradient; the wordmark uses `currentColor`,
 * so the parent controls its colour (white on dark heroes, deep brown on light
 * surfaces). Reused by the navbar and the auth screens.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="brand d-inline-flex align-items-center gap-2">
      <svg
        class="brand-mark"
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vantio-grad" x1="4" y1="3" x2="36" y2="37" gradientUnits="userSpaceOnUse">
            <stop stop-color="#5b2814" />
            <stop offset="1" stop-color="#c25925" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="11.5" fill="url(#vantio-grad)" />
        <path
          d="M11.5 13 L20 27.5 L28.5 13"
          stroke="#ffffff"
          stroke-width="3.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="20" cy="12.6" r="2.5" fill="#ffffff" />
      </svg>

      @if (showWordmark) {
        <span class="brand-wordmark" [style.fontSize.px]="size * 0.7">Vantio</span>
      }
    </span>
  `,
  styles: [
    `
      .brand-mark {
        display: block;
        flex-shrink: 0;
      }
      .brand-wordmark {
        font-family: 'Sora', 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        letter-spacing: 0.005em;
        line-height: 1;
        color: currentColor;
      }
    `,
  ],
})
export class Logo {
  /** Mark size in pixels; the wordmark scales relative to it. */
  @Input() size = 30;

  /** Whether to render the "Vantio" wordmark next to the mark. */
  @Input() showWordmark = true;
}
