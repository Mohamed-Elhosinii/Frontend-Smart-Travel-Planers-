import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-status.html',
  styleUrl: './payment-status.css'
})
export class PaymentStatusPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isSuccess = false;
  isPending = false;
  loading = true;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Paymob redirects with these query parameters
      const success = params['success'];
      const pending = params['pending'];

      if (success === 'true') {
        this.isSuccess = true;
      } else if (pending === 'true') {
        this.isPending = true;
      } else {
        this.isSuccess = false;
      }
      
      this.loading = false;
    });
  }

  goToDashboard() {
    this.router.navigate(['/subscription']);
  }
}
