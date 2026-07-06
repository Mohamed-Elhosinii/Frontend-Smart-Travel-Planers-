/**
 * Domain models for the Subscriptions feature.
 * Mirrors the backend Subscription DTOs.
 */

/** Maps to backend SubscriptionStatus enum. */
export type SubscriptionStatus = 'Active' | 'PastDue' | 'Cancelled' | 'Expired';

/** Maps to backend PlanDto — GET /api/subscription/plans */
export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxTripsPerMonth: number | null;
  maxMessagesPerMonth: number | null;
}

/** Maps to backend SubscriptionDto — GET /api/subscription/my-subscription */
export interface MySubscription {
  planName: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  tripsUsed: number;
  tripsLimit: number | null;
  messagesUsed: number;
  messagesLimit: number | null;
}

/** Maps to backend CreateSubscriptionRequestDto — POST /api/subscription/subscribe (body) */
export interface CreateSubscriptionRequest {
  planId: string;
}

/** Response body of POST /api/subscription/subscribe */
export interface SubscribeResponse {
  iframeUrl: string | null;
}

/** Response body of POST /api/subscription/cancel */
export interface CancelSubscriptionResponse {
  message: string;
}
