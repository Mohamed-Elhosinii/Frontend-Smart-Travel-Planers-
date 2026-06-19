import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { dateRangeValidator } from '../../core/validators/date-range.validator';
import { ToastService } from '../../core/services/toast.service';
import { TripData } from '../../core/models';

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

  readonly travelStyles = TRAVEL_STYLES;
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group(
      {
        from: ['', Validators.required],
        to: ['', Validators.required],
        departureDate: ['', Validators.required],
        returnDate: ['', Validators.required],
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
    const next = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    this.form.patchValue({ travelStyle: next });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const tripData = this.form.getRawValue() as TripData;
    // No generation backend yet — acknowledge and route to the user's trips.
    this.toast.success(`Generating your trip to ${tripData.to}…`);
    this.router.navigate(['/my-trips']);
  }
}
