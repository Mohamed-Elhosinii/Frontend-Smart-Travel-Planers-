import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription as RxSubscription } from 'rxjs';
import { Navbar } from '../../../layout/navbar/navbar';
import { Footer } from '../../../layout/footer/footer';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan } from '../../../core/models';

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [Navbar, Footer, NgClass, DatePipe],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class SubscriptionPage implements OnInit, OnDestroy {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  private pollSub?: RxSubscription;

  readonly plans = this.subscriptionService.plans;
  readonly mySubscription = this.subscriptionService.mySubscription;
  readonly loading = this.subscriptionService.loading;
  readonly subscribingPlanId = signal<string | null>(null);
  readonly awaitingActivation = signal<boolean>(false);
  readonly paymentIframeUrl = signal<string | null>(null);

  readonly safeIframeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.paymentIframeUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly showCancelConfirm = signal<boolean>(false);
  readonly cancelling = signal<boolean>(false);

  ngOnInit(): void {
    this.subscriptionService.loadAll().subscribe();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get canCancel(): boolean {
    const sub = this.mySubscription();
    return !!sub && sub.status === 'Active' && sub.planName !== 'Free';
  }

  isCurrentPlan(plan: Plan): boolean {
    const sub = this.mySubscription();
    return !!sub && sub.status === 'Active' && sub.planName === plan.name;
  }

  canSubscribe(plan: Plan): boolean {
    const sub = this.mySubscription();
    if (!sub || sub.status !== 'Active') return true;

    const currentPlan = this.plans().find(p => p.name === sub.planName);
    if (!currentPlan) return true;

    return plan.priceMonthly > currentPlan.priceMonthly;
  }

  formatPrice(plan: Plan): string {
    return plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly.toFixed(2)}/mo`;
  }

  usagePercent(used: number, limit: number | null): number {
    if (limit === null || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  statusBadgeClass(): string {
    switch (this.mySubscription()?.status) {
      case 'Active': return 'badge-sub-active';
      case 'PastDue': return 'badge-sub-pastdue';
      case 'Expired': return 'badge-sub-expired';
      default: return 'badge-sub-cancelled';
    }
  }

  onSubscribe(plan: Plan): void {
    if (this.isCurrentPlan(plan) || this.subscribingPlanId()) return;
    this.subscribingPlanId.set(plan.id);
    this.subscriptionService.subscribe(plan.id).subscribe({
      next: (res) => {
        this.subscribingPlanId.set(null);
        if (res.iframeUrl) {
          this.paymentIframeUrl.set(res.iframeUrl);
          this.startActivationPolling(plan.name);
        } else {
          this.toast.success(`You're now on the ${plan.name} plan.`);
          this.subscriptionService.loadMySubscription().subscribe();
        }
      },
      error: (err) => {
        console.error('Subscribe failed:', err);
        this.subscribingPlanId.set(null);
        this.toast.danger('Could not start the subscription. Please try again.');
      },
    });
  }

  private startActivationPolling(planName: string): void {
    this.awaitingActivation.set(true);
    this.pollSub?.unsubscribe();
    this.pollSub = this.subscriptionService.pollUntilActive(planName).subscribe({
      next: (sub) => {
        if (sub?.status === 'Active' && sub.planName === planName) {
          this.awaitingActivation.set(false);
          this.paymentIframeUrl.set(null);
          this.toast.success(`Payment confirmed — you're now on the ${planName} plan.`);
        }
      },
      error: () => this.awaitingActivation.set(false),
      complete: () => {
        if (this.awaitingActivation()) {
          this.awaitingActivation.set(false);
          this.toast.danger('Still waiting on payment confirmation. Check back shortly.');
        }
      },
    });
  }

  closePaymentModal(): void {
    this.pollSub?.unsubscribe();
    this.paymentIframeUrl.set(null);
    this.awaitingActivation.set(false);
  }

  onCancelClick(): void {
    this.showCancelConfirm.set(true);
  }

  dismissCancelConfirm(): void {
    if (this.cancelling()) return;
    this.showCancelConfirm.set(false);
  }

  confirmCancel(): void {
    this.cancelling.set(true);
    this.subscriptionService.cancel().subscribe({
      next: () => {
        this.cancelling.set(false);
        this.showCancelConfirm.set(false);
        this.toast.success('Subscription cancelled.');
      },
      error: (err) => {
        console.error('Cancel failed:', err);
        this.cancelling.set(false);
        this.showCancelConfirm.set(false);
        this.toast.danger('Could not cancel the subscription. Please try again.');
      },
    });
  }
}
