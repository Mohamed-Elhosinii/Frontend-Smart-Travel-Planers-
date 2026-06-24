import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, PaymentTransaction } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  transactions: PaymentTransaction[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  loading = false;

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.adminService.getPayments(this.page, this.pageSize).subscribe({
      next: (res) => {
        this.transactions = res.transactions;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching payments:', err);
        this.toast.danger('Failed to load payment transactions.');
        this.loading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.loadPayments();
    }
  }
}
