import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
} from '@angular/core';

/**
 * Premium full-screen overlay shown while a trip is being generated on the
 * backend. Instead of a bare spinner it walks through a set of human-readable
 * steps so the wait feels intentional. Purely presentational — the parent owns
 * the `active` flag and performs the real navigation when generation finishes.
 */
@Component({
  selector: 'app-generation-loader',
  standalone: true,
  template: `
    @if (active) {
      <div
        class="gen-overlay position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center px-4"
        aria-busy="true"
        aria-label="Generating your trip"
      >
        <div class="gen-mark d-flex align-items-center justify-content-center rounded-4 mb-4" aria-hidden="true">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>

        <h2 class="gen-title fw-bold mb-2">Crafting your journey</h2>
        <p class="gen-sub mb-4">Our AI concierge is putting the finishing touches on your trip…</p>

        <!-- Concise, single polite live-region announcing only the current step. -->
        <span class="visually-hidden" role="status" aria-live="polite">{{ steps[current()] }}</span>

        <ul class="gen-steps list-unstyled text-start m-0">
          @for (step of steps; track step; let i = $index) {
            <li class="gen-step d-flex align-items-center gap-3 py-2"
                [class.done]="i < current()"
                [class.active]="i === current()">
              <span class="gen-step-icon d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0">
                @if (i < current()) {
                  <i class="fa-solid fa-check"></i>
                } @else if (i === current()) {
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                } @else {
                  <span class="gen-dot"></span>
                }
              </span>
              <span class="gen-step-label fw-semibold">{{ step }}</span>
            </li>
          }
        </ul>

        <div class="gen-progress mt-4 rounded-pill overflow-hidden">
          <div class="gen-progress-bar h-100 rounded-pill" [style.width.%]="progress()"></div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .gen-overlay {
        z-index: var(--z-modal, 1200);
        background:
          radial-gradient(circle at 30% 20%, rgba(194, 89, 37, 0.16), transparent 55%),
          var(--body-bg);
        animation: gen-fade var(--transition-fast);
      }
      .gen-mark {
        width: 4.5rem;
        height: 4.5rem;
        font-size: 1.75rem;
        color: #fff;
        background: var(--trip-gradient);
        box-shadow: var(--shadow-brand);
        animation: gen-float 2.4s ease-in-out infinite;
      }
      .gen-title {
        font-family: 'Playfair Display', serif;
        font-size: clamp(1.6rem, 4vw, 2.2rem);
        color: var(--secondary-dark);
      }
      .gen-sub {
        color: var(--text-muted);
        max-width: 26rem;
      }
      .gen-steps {
        width: 100%;
        max-width: 24rem;
      }
      .gen-step {
        color: var(--text-muted);
        opacity: 0.55;
        transition: var(--transition-smooth);
      }
      .gen-step.active,
      .gen-step.done {
        opacity: 1;
        color: var(--secondary-dark);
      }
      .gen-step-icon {
        width: 1.75rem;
        height: 1.75rem;
        border: 1px solid var(--border-color);
        background: #fff;
        color: var(--primary-orange);
        font-size: 0.7rem;
      }
      .gen-step.done .gen-step-icon {
        background: var(--trip-gradient);
        border-color: transparent;
        color: #fff;
      }
      .gen-dot {
        width: 0.4rem;
        height: 0.4rem;
        border-radius: 50%;
        background: var(--border-color);
      }
      .gen-progress {
        width: min(24rem, 100%);
        height: 0.35rem;
        background: var(--border-color);
      }
      .gen-progress-bar {
        background: var(--trip-gradient);
        transition: width 0.6s ease;
      }
      @keyframes gen-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes gen-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `,
  ],
})
export class GenerationLoader implements OnChanges, OnDestroy {
  /** When true the overlay is shown and the step animation runs. */
  @Input() active = false;

  readonly steps = [
    'Understanding your travel request',
    'Finding the best destinations',
    'Building your itinerary',
    'Optimizing activities',
    'Calculating budget',
    'Finalizing your trip',
  ];

  readonly current = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  progress = () => Math.round(((this.current() + 1) / this.steps.length) * 100);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active']) {
      this.active ? this.start() : this.stop();
    }
  }

  private start(): void {
    this.current.set(0);
    this.stopTimer();
    // Advance through the steps, holding on the final one until the parent
    // hides the overlay (i.e. real generation actually finished).
    this.timer = setInterval(() => {
      if (this.current() < this.steps.length - 1) {
        this.current.update((v) => v + 1);
      }
    }, 1400);
  }

  private stop(): void {
    this.stopTimer();
    this.current.set(0);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
