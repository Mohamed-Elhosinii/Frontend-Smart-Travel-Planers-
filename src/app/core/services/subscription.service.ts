import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, finalize, switchMap, takeWhile, tap } from 'rxjs/operators';
import {
  CancelSubscriptionResponse,
  MySubscription,
  Plan,
  SubscribeResponse,
} from '../models';

const API_BASE = 'https://localhost:7162/api/subscription';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);

  private readonly _plans = signal<Plan[]>([]);
  private readonly _mySubscription = signal<MySubscription | null>(null);
  private readonly _loading = signal<boolean>(false);

  readonly plans = this._plans.asReadonly();
  readonly mySubscription = this._mySubscription.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isActive = computed(() => this._mySubscription()?.status === 'Active');

  loadPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${API_BASE}/plans`).pipe(
      tap((plans) => this._plans.set(plans)),
      catchError((err) => {
        console.error('Failed to load subscription plans:', err);
        return of([]);
      }),
    );
  }

  loadMySubscription(): Observable<MySubscription | null> {
    return this.http.get<MySubscription>(`${API_BASE}/my-subscription`).pipe(
      tap((sub) => this._mySubscription.set(sub)),
      catchError((err) => {
        console.error('Failed to load current subscription:', err);
        return of(null);
      }),
    );
  }

  loadAll(): Observable<[Plan[], MySubscription | null]> {
    this._loading.set(true);
    return this.loadPlans().pipe(
      switchMap((plans) => this.loadMySubscription().pipe(
        switchMap((sub) => of([plans, sub] as [Plan[], MySubscription | null])),
      )),
      finalize(() => this._loading.set(false)),
    );
  }

  subscribe(planId: string): Observable<SubscribeResponse> {
    return this.http.post<SubscribeResponse>(`${API_BASE}/subscribe`, { planId });
  }

  cancel(): Observable<CancelSubscriptionResponse> {
    return this.http.post<CancelSubscriptionResponse>(`${API_BASE}/cancel`, {}).pipe(
      tap(() => this.loadMySubscription().subscribe()),
    );
  }

  pollUntilActive(planName: string): Observable<MySubscription | null> {
    let attempts = 0;
    return timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.loadMySubscription()),
      tap(() => attempts++),
      takeWhile(
        (sub) => !(sub?.status === 'Active' && sub.planName === planName) && attempts < POLL_MAX_ATTEMPTS,
        true,
      ),
    );
  }
}
