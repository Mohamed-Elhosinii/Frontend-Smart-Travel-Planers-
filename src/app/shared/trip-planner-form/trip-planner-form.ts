import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { dateRangeValidator } from '../../core/validators/date-range.validator';
import { ToastService } from '../../core/services/toast.service';
import { TripCreateDto } from '../../core/models';
import { APP_ROUTES } from '../../core/constants/routes';
import { MESSAGES } from '../../core/constants/messages';
import { TripService } from '../../core/services/trip.service';

/** Selectable travel-style options for the planner form. */
export const TRAVEL_STYLES = [
  'Adventure',
  'Relaxation',
  'Cultural',
  'Foodie',
  'Nature',
  'Luxury',
  'Nightlife',
  'Family',
] as const;

const STEP_MINIMUMS: Record<string, number> = { adults: 1, children: 0, rooms: 1 };

/** Destination suggestion returned when a query needs user confirmation. */
interface DestinationSuggestion {
  resolvedName: string;
  destId: string;
  destType?: string;
}

/** Which inline dropdown panel is currently expanded. */
type PlannerPanel = 'travelers' | 'style' | null;

interface UnverifiedWarning {
  places: string[];
  toRes: any;
  fromRes: any;
}

/**
 * Reusable trip-planner form.
 *
 * Collects trip preferences, resolves the destination, requests an AI
 * itinerary, and redirects to the generated trip. Rendered standalone on the
 * `/plan` page, embedded in the landing page, and inside the navbar modal —
 * so it owns all planning logic and keeps no state outside its own form.
 */
@Component({
  selector: 'app-trip-planner-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './trip-planner-form.html',
  styleUrl: './trip-planner-form.css',
})
export class TripPlannerForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly tripService = inject(TripService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Emitted once a plan starts generating, so a host (e.g. modal) can close. */
  @Output() submitted = new EventEmitter<void>();

  readonly travelStyles = TRAVEL_STYLES;
  readonly form: FormGroup;

  isCreatingPlan = false;
  isRedirecting = false;
  isResolving = false;

  openPanel: PlannerPanel = null;

  confirmationSuggestion: DestinationSuggestion | null = null;
  resolvedDestId: string | null = null;
  resolvedDestType: string | null = null;
  unverifiedWarning: UnverifiedWarning | null = null;

  constructor() {
    this.form = this.fb.group(
      {
        from: ['', [Validators.required, this.cityCountryValidator.bind(this)]],
        to: ['', [Validators.required, this.cityCountryValidator.bind(this)]],
        departureDate: ['', [Validators.required, this.pastDateValidator]],
        returnDate: ['', [Validators.required, this.pastDateValidator]],
        adults: [1, [Validators.required, Validators.min(1)]],
        children: [0],
        rooms: [1],
        travelStyle: [[] as string[]],
        budget: ['', [Validators.required]],
        specialRequests: [''],
        isRoundTrip: [true],
      },
      { validators: dateRangeValidator },
    );

    // Reset any prior resolution when the user edits the destination again.
    this.form.get('to')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.confirmationSuggestion = null;
        this.resolvedDestId = null;
        this.resolvedDestType = null;
        this.unverifiedWarning = null;
      });

    // Reset unverified warning when the user edits the departure city.
    this.form.get('from')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.unverifiedWarning = null;
      });
  }

  cityCountryValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length < 2 || parts[0].trim().length < 2 || parts[1].trim().length < 2) {
      return { cityCountryFormat: true };
    }
    return null;
  }

  pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(control.value) < today ? { pastDate: true } : null;
  }

  /**
   * Opens the native date picker for the whole field. Native `type=date`
   * inputs only open on the (hidden) calendar icon, so a click anywhere on the
   * field triggers `showPicker()`. Guarded for browsers/contexts that don't
   * allow it — normal focus/typing still works there.
   */
  openDatePicker(el: HTMLInputElement): void {
    const input = el as HTMLInputElement & { showPicker?: () => void };
    try {
      input.showPicker?.();
    } catch {
      /* showPicker not permitted (e.g. programmatic call) — native UI still available */
    }
  }

  // ── Inline dropdown panels (Travelers & Rooms / Travel Style) ──────────

  togglePanel(panel: Exclude<PlannerPanel, null>): void {
    this.openPanel = this.openPanel === panel ? null : panel;
  }

  /**
   * Captures every click that bubbles up through the form host element and
   * stops it from reaching the document listener below — so only genuine
   * clicks *outside* the form component close the panel via onDocumentClick.
   * Also closes the panel immediately when the user clicks inside the form
   * on any element that is not a dropdown trigger or an open panel.
   */
  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.openPanel === null) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.planner-trigger') && !target.closest('.planner-panel')) {
      this.openPanel = null;
    }
  }

  /** Closes any open panel when the user clicks anywhere outside the form. */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.openPanel = null;
  }

  get travelersSummary(): string {
    const people = (Number(this.form.value.adults) || 0) + (Number(this.form.value.children) || 0);
    const rooms = Number(this.form.value.rooms) || 0;
    const people_label = `${people} Traveler${people === 1 ? '' : 's'}`;
    const rooms_label = `${rooms} Room${rooms === 1 ? '' : 's'}`;
    return `${people_label} · ${rooms_label}`;
  }

  get styleSummary(): string {
    const styles = (this.form.value.travelStyle as string[]) ?? [];
    if (styles.length === 0) return 'Any style';
    if (styles.length === 1) return styles[0];
    return `${styles.length} styles selected`;
  }

  // ── Steppers & style chips ─────────────────────────────────────────────

  increase(field: string): void {
    this.form.patchValue({ [field]: (this.form.get(field)?.value ?? 0) + 1 });
  }

  decrease(field: string): void {
    const value = this.form.get(field)?.value ?? 0;
    if (value > (STEP_MINIMUMS[field] ?? 0)) {
      this.form.patchValue({ [field]: value - 1 });
    }
  }

  isStyleSelected(style: string): boolean {
    return (this.form.value.travelStyle as string[]).includes(style);
  }

  toggleStyle(style: string): void {
    const current = this.form.value.travelStyle as string[];
    const next = current.includes(style) ? current.filter((s) => s !== style) : [...current, style];
    this.form.patchValue({ travelStyle: next });
  }

  // ── Submission pipeline ────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid || this.isCreatingPlan || this.isResolving) {
      this.form.markAllAsTouched();
      return;
    }

    const destination = ((this.form.getRawValue().to as string) ?? '').trim();
    const origin = ((this.form.getRawValue().from as string) ?? '').trim();

    if (this.resolvedDestId || this.confirmationSuggestion) {
      this.createPlan();
      return;
    }

    this.isResolving = true;
    forkJoin({
      toRes: this.tripService.resolveDestination(destination),
      fromRes: origin ? this.tripService.resolveDestination(origin) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ toRes, fromRes }) => {
          this.isResolving = false;

          // Check if destination was not found
          if (toRes.status === 'NotFound' || toRes.status === 2) {
            this.toast.danger(MESSAGES.destinationNotFound);
            return;
          }

          // Check if destination needs confirmation
          if (toRes.status === 'NeedsConfirmation' || toRes.status === 1) {
            this.confirmationSuggestion = toRes.suggestion;
            return;
          }

          // Check if origin was not found
          if (fromRes && (fromRes.status === 'NotFound' || fromRes.status === 2)) {
            this.toast.danger(`Departure city "${origin}" was not found.`);
            return;
          }

          // Check for fallback (unverified) source on either destination or origin
          const unverifiedList: string[] = [];
          if (toRes.source === 'fallback') {
            unverifiedList.push(`Destination (${destination})`);
          }
          if (fromRes && fromRes.source === 'fallback') {
            unverifiedList.push(`Departure (${origin})`);
          }

          if (unverifiedList.length > 0) {
            this.unverifiedWarning = {
              places: unverifiedList,
              toRes,
              fromRes,
            };
          } else {
            // Both are verified places! Proceed to create plan.
            this.resolvedDestId = toRes.destId;
            this.resolvedDestType = toRes.destType;
            this.createPlan();
          }
        },
        error: () => {
          this.isResolving = false;
          this.toast.danger(MESSAGES.destinationResolveFailed);
        },
      });
  }

  proceedWithUnverified(): void {
    if (!this.unverifiedWarning) return;
    const toRes = this.unverifiedWarning.toRes;
    this.resolvedDestId = toRes.destId;
    this.resolvedDestType = toRes.destType;
    this.unverifiedWarning = null;
    this.createPlan();
  }

  cancelUnverified(): void {
    this.unverifiedWarning = null;
  }

  acceptSuggestion(): void {
    if (!this.confirmationSuggestion) return;
    this.form.patchValue({ to: this.confirmationSuggestion.resolvedName });
    this.resolvedDestId = this.confirmationSuggestion.destId;
    this.resolvedDestType = this.confirmationSuggestion.destType || 'city';

    this.tripService
      .confirmDestination(this.resolvedDestId!, this.confirmationSuggestion.resolvedName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.confirmationSuggestion = null;
    this.createPlan();
  }

  rejectSuggestion(): void {
    this.confirmationSuggestion = null;
    this.form.get('to')?.setValue('');
    this.form.get('to')?.markAsTouched();
  }

  private createPlan(): void {
    const v = this.form.getRawValue();
    const origin = ((v.from as string) ?? '').trim();

    const dto: TripCreateDto = {
      destination: ((v.to as string) ?? '').trim(),
      destId: this.resolvedDestId,
      destType: this.resolvedDestType,
      originCity: origin ? origin : null,
      startDate: v.departureDate,
      endDate: v.returnDate,
      numTravelers: (Number(v.adults) || 0) + (Number(v.children) || 0),
      budgetTotal: parseFloat(v.budget),
      preferences: (v.travelStyle as string[]) ?? [],
      isRoundTrip: v.isRoundTrip,
    };

    this.isCreatingPlan = true;
    this.tripService.createQuickPlan(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.tripId) {
            this.isCreatingPlan = false;
            this.toast.danger(res.message ?? MESSAGES.tripCreateFailed);
            return;
          }
          // Hand off to the trip page immediately; it owns the single generation
          // loader and polls for the itinerary (no duplicate loader / re-fetch here).
          this.isRedirecting = true;
          this.submitted.emit();
          this.router.navigate([APP_ROUTES.myTrips, res.tripId], {
            queryParams: { generating: 1 },
          });
        },
        error: () => {
          this.isCreatingPlan = false;
          this.toast.danger(MESSAGES.tripCreateFailed);
        },
      });
  }
}
