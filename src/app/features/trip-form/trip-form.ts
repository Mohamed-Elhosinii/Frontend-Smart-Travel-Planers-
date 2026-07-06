import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { TripPlannerForm } from '../../shared/trip-planner-form/trip-planner-form';

/**
 * Full-page trip planner (route `/plan`).
 *
 * A thin wrapper around the shared {@link TripPlannerForm}; the planning logic
 * lives entirely in that reusable component so the page, the landing embed, and
 * the navbar modal all stay in sync.
 */
@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [Navbar, TripPlannerForm],
  templateUrl: './trip-form.html',
  styleUrl: './trip-form.css',
})
<<<<<<< Updated upstream
export class TripFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly tripService = inject(TripService);

  readonly travelStyles = TRAVEL_STYLES;
  readonly form: FormGroup;

  isCreatingPlan = false;
  isRedirecting = false;

  pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(control.value) < today ? { pastDate: true } : null;
  }

  constructor() {
    this.form = this.fb.group(
      {
        from: ['', Validators.required],
        to: ['', Validators.required],
        departureDate: ['', [Validators.required, this.pastDateValidator]],
        returnDate: ['', [Validators.required, this.pastDateValidator]],
        adults: [1, [Validators.required, Validators.min(1)]],
        children: [0],
        rooms: [1],
        travelStyle: [[] as string[]],
        budget: ['', [Validators.required, Validators.min(MIN_BUDGET)]],
        specialRequests: [''],
      },
      { validators: dateRangeValidator },
    );
  }

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

  submit(): void {
    if (this.form.invalid || this.isCreatingPlan) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const origin = (v.from ?? '').trim();

    // Map the form to the backend TripCreateDto (exact field names).
    const dto: TripCreateDto = {
      destination: (v.to ?? '').trim(),
      originCity: origin ? origin : null, // empty origin → null = trip without a flight
      startDate: v.departureDate, // <input type="date"> already yields yyyy-MM-dd
      endDate: v.returnDate,
      numTravelers: (Number(v.adults) || 0) + (Number(v.children) || 0),
      budgetTotal: parseFloat(v.budget), // matches Validators.min's parseFloat parsing
      preferences: (v.travelStyle as string[]) ?? [],
    };

    this.isCreatingPlan = true;
    this.tripService.createQuickPlan(dto).subscribe({
      next: (res) => {
        // Monthly trip limit reached → backend returns { message } and no tripId.
        if (!res.tripId) {
          this.isCreatingPlan = false;
          this.toast.danger(res.message ?? 'تعذّر إنشاء الرحلة، حاول تاني');
          return;
        }
        this.awaitPlan(res.tripId);
      },
      error: () => {
        this.isCreatingPlan = false;
        this.toast.danger('تعذّر إنشاء الرحلة، حاول تاني');
      },
    });
  }

  /**
   * The plan builds in the background — poll the SAME helper the chat flow uses,
   * then redirect to the new trip's detail page. On timeout/error, stay on the form.
   */
  private awaitPlan(tripId: string): void {
    this.tripService.pollPlan(tripId).subscribe({
      next: () => {
        this.isRedirecting = true;
        this.router.navigate(['/my-trips', tripId]);
      },
      error: () => {
        this.isCreatingPlan = false;
        this.toast.danger('تعذّر إنشاء الرحلة، حاول تاني');
      },
    });
  }
}
=======
export class TripFormPage {}
>>>>>>> Stashed changes
