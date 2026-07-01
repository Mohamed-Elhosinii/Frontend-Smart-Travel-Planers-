import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { dateRangeValidator } from '../../core/validators/date-range.validator';
import { ToastService } from '../../core/services/toast.service';
import { TripCreateDto } from '../../core/models';
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

/** Minimum spend (per the budget validator) before a trip can be generated. */
const MIN_BUDGET = 1000;

const STEP_MINIMUMS: Record<string, number> = { adults: 1, children: 0, rooms: 1 };

/** Trip planner form: collects preferences and requests an AI itinerary. */
@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Navbar],
  templateUrl: './trip-form.html',
  styleUrl: './trip-form.css',
})
export class TripFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly tripService = inject(TripService);

  readonly travelStyles = TRAVEL_STYLES;
  readonly form: FormGroup;

  isCreatingPlan = false;
  isRedirecting = false;
  isResolving = false;
  
  confirmationSuggestion: any = null;
  resolvedDestId: string | null = null;
  resolvedDestType: string | null = null;

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
    
    // Reset resolution if user types in destination again
    this.form.get('to')?.valueChanges.subscribe(() => {
        this.confirmationSuggestion = null;
        this.resolvedDestId = null;
        this.resolvedDestType = null;
    });
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
    if (this.form.invalid || this.isCreatingPlan || this.isResolving) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const destination = (v.to ?? '').trim();
    
    if (!this.resolvedDestId && !this.confirmationSuggestion) {
        this.isResolving = true;
        this.tripService.resolveDestination(destination).subscribe({
            next: (res) => {
                this.isResolving = false;
                if (res.status === 0 || res.status === 'Resolved') { // 0 = Resolved (enum value)
                    this.resolvedDestId = res.destId;
                    this.resolvedDestType = res.destType;
                    this.createPlan();
                } else if (res.status === 1 || res.status === 'NeedsConfirmation') { // 1 = NeedsConfirmation
                    this.confirmationSuggestion = res.suggestion;
                } else {
                    this.toast.danger('Destination not found. Please try another city.');
                }
            },
            error: () => {
                this.isResolving = false;
                this.toast.danger('Failed to resolve destination. Check your connection.');
            }
        });
    } else {
        this.createPlan();
    }
  }
  
  acceptSuggestion(): void {
      if (this.confirmationSuggestion) {
          this.form.patchValue({ to: this.confirmationSuggestion.resolvedName });
          this.resolvedDestId = this.confirmationSuggestion.destId;
          this.resolvedDestType = this.confirmationSuggestion.destType || 'city';
          
          this.tripService.confirmDestination(this.resolvedDestId!, this.confirmationSuggestion.resolvedName).subscribe();
          
          this.confirmationSuggestion = null;
          this.createPlan();
      }
  }
  
  rejectSuggestion(): void {
      this.confirmationSuggestion = null;
      this.form.get('to')?.setValue('');
      this.form.get('to')?.markAsTouched();
  }

  private createPlan(): void {
    const v = this.form.getRawValue();
    const origin = (v.from ?? '').trim();

    const dto: TripCreateDto = {
      destination: (v.to ?? '').trim(),
      destId: this.resolvedDestId,
      destType: this.resolvedDestType,
      originCity: origin ? origin : null,
      startDate: v.departureDate,
      endDate: v.returnDate,
      numTravelers: (Number(v.adults) || 0) + (Number(v.children) || 0),
      budgetTotal: parseFloat(v.budget),
      preferences: (v.travelStyle as string[]) ?? [],
    };

    this.isCreatingPlan = true;
    this.tripService.createQuickPlan(dto).subscribe({
      next: (res) => {
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
