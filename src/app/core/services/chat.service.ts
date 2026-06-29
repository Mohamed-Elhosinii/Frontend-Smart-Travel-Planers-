import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatItinerary, ChatMessage, ChatSession, TripPlanDto } from '../models';
import { tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private idCounter = 0;

  private readonly _messages = signal<ChatMessage[]>([]);
  readonly messages = this._messages.asReadonly();
  private readonly _currentTripId = signal<string | null>(null);
  readonly currentTripId = this._currentTripId.asReadonly();

  readonly suggestions: string[] = [
    'Plan a 5-day budget trip to Cairo, Egypt',
    'Create a luxury honeymoon itinerary for Maldives',
    'A 3-day adventure weekend getaway to Dahab',
    'Plan a family summer vacation to Paris for 7 days',
  ];

  history: ChatSession[] = [];
  private currentSessionId: string | null = null;

  hasActiveSession(): boolean {
    return this.currentSessionId !== null;
  }

  createSession(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>('/api/Chat/session', {}, { headers }).pipe(
      tap((session) => {
        this.currentSessionId = session.sessionId;
        this._messages.set([this.welcomeMessage()]);
      }),
    );
  }

  sendMessage(text: string): Observable<any> {
    if (!this.currentSessionId) {
      throw new Error('No active chat session. Please start a new journey.');
    }

    const headers = this.getAuthHeaders();
    return this.http
      .post<any>(`/api/Chat/send`, { sessionId: this.currentSessionId, message: text }, { headers })
      .pipe(
        tap((response) => {
          if (response.tripId) {
            this._currentTripId.set(response.tripId); // ← أضيفي السطر ده
          }
          this.addAssistantReply(
            response.message,
            response.plan ? this.toChatItinerary(response.plan) : undefined,
          );
        }),
      );
  }

  loadUserSessions(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<ChatSession[]>('/api/Chat/sessions', { headers }).pipe(
      tap((sessions) => {
        this.history = sessions;
        // حفظ كل tripId موجود في localStorage عشان My Trips تلاقيه
        const tripIds = sessions.filter((s) => !!s.tripId).map((s) => s.tripId as string);
        if (tripIds.length > 0) {
          localStorage.setItem('userTripIds', JSON.stringify(tripIds));
        }
      }),
      catchError((err) => {
        console.error('Failed to load sessions', err);
        return of([]);
      }),
    );
  }

  loadSessionChat(sessionId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`/api/Chat/history/${sessionId}`, { headers }).pipe(
      tap((messages) => {
        this.currentSessionId = sessionId;
        this._messages.set((messages ?? []).map((m: any) => this.mapHistoryMessage(m)));
      }),
    );
  }

  reset(): void {
    this.currentSessionId = null;
    this._currentTripId.set(null); // ← اعمليها null عند reset
    this._messages.set([]);
    this.createSession().subscribe({
      error: (err) => console.error('Failed to create session:', err),
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token && token.trim() !== '') {
      headers = headers.set('Authorization', `Bearer ${token.trim()}`);
    }
    return headers;
  }

  addUserMessage(text: string): void {
    this.append({
      id: this.nextId(),
      sender: 'user',
      text,
      time: this.currentTime(),
    });
  }

  addSystemErrorMessage(text: string): void {
    this.append({
      id: this.nextId(),
      sender: 'system',
      text,
      time: this.currentTime(),
    });
  }

  private addAssistantReply(text: string, planData?: ChatItinerary): void {
    this.append({
      id: this.nextId(),
      sender: 'assistant',
      text,
      time: this.currentTime(),
      isItinerary: !!planData,
      itineraryData: planData,
    });
  }

  private toChatItinerary(plan: TripPlanDto): ChatItinerary {
    return {
      destination: plan.destination,
      duration: `${plan.days?.length ?? 0} days`,
      budget: `$${plan.budgetTotal}`,
      days: (plan.days ?? []).map((d) => ({
        dayNum: d.dayNumber,
        title: d.date,
        activities: (d.activities ?? []).map((a) => a.name),
      })),
    };
  }

  private append(message: ChatMessage): void {
    this._messages.update((list) => [...list, message]);
  }

  private nextId(): string {
    this.idCounter += 1;
    return `m${this.idCounter}`;
  }

  private welcomeMessage(): ChatMessage {
    return {
      id: this.nextId(),
      sender: 'assistant',
      text: 'أهلاً بك! أنا مساعدك الذكي للسفر. لمساعدتك في التخطيط، يرجى تزويدي بالوجهة، تواريخ السفر، ميزانيتك، وعدد المسافرين.',
      time: this.currentTime(),
    };
  }

  private currentTime(): string {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  private mapHistoryMessage(m: any): ChatMessage {
    return {
      id: String(m?.id ?? this.nextId()),
      sender: this.mapRole(m?.role),
      text: m?.content ?? '',
      time: this.formatTimeFrom(m?.createdAt),
    };
  }

  private mapRole(role: any): 'user' | 'assistant' | 'system' {
    const r = typeof role === 'string' ? role.toLowerCase() : role;
    if (r === 0 || r === 'user') return 'user';
    if (r === 2 || r === 'system' || r === 3 || r === 'tool') return 'system';
    return 'assistant';
  }

  private formatTimeFrom(iso: string | null | undefined): string {
    if (!iso) return this.currentTime();
    const hasTz = /[zZ]|[+-]\d\d:?\d\d$/.test(iso);
    const d = new Date(hasTz ? iso : iso + 'Z');
    if (isNaN(d.getTime())) return this.currentTime();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}