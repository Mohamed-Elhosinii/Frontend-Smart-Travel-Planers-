import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../config/endpoints';

export interface OverviewStats {
  totalUsers: number;
  totalTrips: number;
  activeSubscriptions: number;
  totalRevenue: number;
  revenueHistory: { month: string; revenue: number }[];
  userRegistrations: { date: string; count: number }[];
}

export interface UserDto {
  userId: string;
  fullName: string;
  email: string;
  createdAt: string;
  planName: string;
  planId: string;
  subscriptionStatus: string;
  isBanned: boolean;
}

export interface PaginatedUsers {
  users: UserDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PlanDto {
  id: string;
  name: string;
  priceMonthly: number;
  maxTripsPerMonth: number | null;
  maxMessagesPerMonth: number | null;
}

export interface CreatePlanDto {
  name: string;
  priceMonthly: number;
  maxTripsPerMonth: number | null;
  maxMessagesPerMonth: number | null;
}

export interface PaymentTransaction {
  id: string;
  userEmail: string;
  planName: string;
  amount: number;
  status: string;
  createdAt: string;
  paymobOrderId: string;
  paymobTransactionId: string;
}

export interface PaginatedPayments {
  transactions: PaymentTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  // 1. Stats Overview
  getOverviewStats(): Observable<OverviewStats> {
    return this.http.get<OverviewStats>(ENDPOINTS.admin.statsOverview);
  }

  // 2. Users Management
  getUsers(search?: string, page = 1, pageSize = 10): Observable<PaginatedUsers> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedUsers>(ENDPOINTS.admin.users, { params });
  }

  forceUpdateUserPlan(userId: string, planId: string): Observable<{ message: string }> {
    // Send the raw GUID string as a JSON value
    return this.http.put<{ message: string }>(
      ENDPOINTS.admin.userPlan(userId),
      JSON.stringify(planId),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  toggleUserStatus(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(ENDPOINTS.admin.userToggleStatus(userId), {});
  }

  // 3. Plans CRUD
  getPlans(): Observable<PlanDto[]> {
    return this.http.get<PlanDto[]>(ENDPOINTS.admin.plans);
  }

  createPlan(plan: CreatePlanDto): Observable<PlanDto> {
    return this.http.post<PlanDto>(ENDPOINTS.admin.plans, plan);
  }

  updatePlan(id: string, plan: CreatePlanDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(ENDPOINTS.admin.plan(id), plan);
  }

  deletePlan(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(ENDPOINTS.admin.plan(id));
  }

  // 4. Payments
  getPayments(page = 1, pageSize = 10): Observable<PaginatedPayments> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedPayments>(ENDPOINTS.admin.payments, { params });
  }
}
