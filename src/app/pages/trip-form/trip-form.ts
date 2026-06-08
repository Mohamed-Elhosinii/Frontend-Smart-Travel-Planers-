import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { dateRangeValidator } from '../../validators/date-validator';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-trip-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './trip-form.html',
  styleUrl: './trip-form.css',
})
export class TripForm {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        from: ['', Validators.required],
        to: ['', Validators.required],

        departureDate: ['', Validators.required],
        returnDate: ['', Validators.required],

        adults: [1, [Validators.required, Validators.min(1)]],
        children: [0],
        rooms: [1],

        travelStyle: [[]],

        budget: ['', [Validators.required, Validators.min(1000)]],
        specialRequests: [''],
      },
      {
        validators: dateRangeValidator,
      },
    );
  }
  // counters
  increase(field: string) {
    const value = this.form.get(field)?.value;
    this.form.patchValue({ [field]: value + 1 });
  }

  decrease(field: string) {
    const value = this.form.get(field)?.value;

    const minValues: any = {
      adults: 1,
      children: 0,
      rooms: 1,
    };

    if (value > (minValues[field] ?? 0)) {
      this.form.patchValue({ [field]: value - 1 });
    }
  }

  // travel style toggle
  toggleStyle(style: string) {
    const current = this.form.value.travelStyle;

    if (current.includes(style)) {
      this.form.patchValue({
        travelStyle: current.filter((s: string) => s !== style),
      });
    } else {
      this.form.patchValue({
        travelStyle: [...current, style],
      });
    }
  }

  submit() {
    console.log(this.form.value);
  }
}
