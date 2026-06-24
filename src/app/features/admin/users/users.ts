import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserDto, PlanDto } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  users: UserDto[] = [];
  plans: PlanDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  searchQuery = '';
  loading = false;
  updatingUserId: string | null = null;

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadPlans();
    this.loadUsers();

    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.page = 1;
      this.loadUsers();
    });
  }

  loadPlans() {
    this.adminService.getPlans().subscribe({
      next: (data) => this.plans = data,
      error: (err) => console.error('Failed to load plans:', err)
    });
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers(this.searchQuery, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.users = res.users;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.toast.danger('Failed to load users.');
        this.loading = false;
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  toggleBanStatus(user: UserDto) {
    const action = user.isBanned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    this.updatingUserId = user.userId;
    this.adminService.toggleUserStatus(user.userId).subscribe({
      next: (res) => {
        user.isBanned = !user.isBanned;
        this.toast.success(res.message || `User status updated successfully.`);
        this.updatingUserId = null;
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        this.toast.danger('Failed to change user status.');
        this.updatingUserId = null;
      }
    });
  }

  changePlan(user: UserDto, event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    const newPlanId = selectEl.value;
    if (!newPlanId) return;

    this.updatingUserId = user.userId;
    this.adminService.forceUpdateUserPlan(user.userId, newPlanId).subscribe({
      next: (res) => {
        user.planId = newPlanId;
        const matched = this.plans.find(p => p.id === newPlanId);
        if (matched) {
          user.planName = matched.name;
        }
        this.toast.success(res.message || 'User plan updated successfully.');
        this.updatingUserId = null;
      },
      error: (err) => {
        console.error('Failed to update plan:', err);
        this.toast.danger('Failed to update plan.');
        this.updatingUserId = null;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadUsers();
    }
  }
}
