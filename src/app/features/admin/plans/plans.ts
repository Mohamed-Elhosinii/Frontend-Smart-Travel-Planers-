import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PlanDto, CreatePlanDto } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans.html',
  styleUrl: './plans.css'
})
export class Plans implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  plans: PlanDto[] = [];
  loading = false;
  
  // Modal / Form state
  showModal = false;
  isEditMode = false;
  selectedPlanId: string | null = null;

  // Form Fields
  planForm: CreatePlanDto = {
    name: '',
    priceMonthly: 0,
    maxTripsPerMonth: null,
    maxMessagesPerMonth: null
  };

  // Checkbox helpers since 'null' in backend represents unlimited
  unlimitedTrips = true;
  unlimitedMessages = true;

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loading = true;
    this.adminService.getPlans().subscribe({
      next: (data) => {
        this.plans = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load plans:', err);
        this.toast.danger('Failed to load subscription plans.');
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedPlanId = null;
    this.planForm = {
      name: '',
      priceMonthly: 0,
      maxTripsPerMonth: null,
      maxMessagesPerMonth: null
    };
    this.unlimitedTrips = true;
    this.unlimitedMessages = true;
    this.showModal = true;
  }

  openEditModal(plan: PlanDto) {
    this.isEditMode = true;
    this.selectedPlanId = plan.id;
    this.planForm = {
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      maxTripsPerMonth: plan.maxTripsPerMonth,
      maxMessagesPerMonth: plan.maxMessagesPerMonth
    };
    this.unlimitedTrips = plan.maxTripsPerMonth === null;
    this.unlimitedMessages = plan.maxMessagesPerMonth === null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  savePlan() {
    if (!this.planForm.name.trim()) {
      this.toast.danger('Plan name is required.');
      return;
    }

    // Set value or null depending on unlimited checkbox
    const payload: CreatePlanDto = {
      name: this.planForm.name,
      priceMonthly: this.planForm.priceMonthly,
      maxTripsPerMonth: this.unlimitedTrips ? null : this.planForm.maxTripsPerMonth,
      maxMessagesPerMonth: this.unlimitedMessages ? null : this.planForm.maxMessagesPerMonth
    };

    if (this.isEditMode && this.selectedPlanId) {
      this.adminService.updatePlan(this.selectedPlanId, payload).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Plan updated successfully.');
          this.showModal = false;
          this.loadPlans();
        },
        error: (err) => {
          console.error('Failed to update plan:', err);
          this.toast.danger('Failed to update plan.');
        }
      });
    } else {
      this.adminService.createPlan(payload).subscribe({
        next: (res) => {
          this.toast.success(`Plan "${res.name}" created successfully.`);
          this.showModal = false;
          this.loadPlans();
        },
        error: (err) => {
          console.error('Failed to create plan:', err);
          this.toast.danger('Failed to create plan.');
        }
      });
    }
  }

  deletePlan(plan: PlanDto) {
    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) return;

    this.adminService.deletePlan(plan.id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Plan deleted successfully.');
        this.loadPlans();
      },
      error: (err) => {
        console.error('Failed to delete plan:', err);
        // Error handling if active subscriptions are attached
        this.toast.danger('Failed to delete plan. Active subscriptions might be attached to it.');
      }
    });
  }
}
