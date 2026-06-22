import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatItinerary, ChatMessage, ChatSession } from '../models';
import { tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Chat state and API integration for the AI itinerary planner.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private idCounter = 0;

  private readonly _messages = signal<ChatMessage[]>([]);
  readonly messages = this._messages.asReadonly();

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
    // Use an empty body for POST as required by standard session creation
    return this.http.post<any>('http://localhost:5000/api/Chat/session', {}, { headers }).pipe(
      tap(session => {
        this.currentSessionId = session.sessionId;
        this._messages.set([this.welcomeMessage()]);
      })
    );
  }

  sendMessage(text: string): Observable<any> {
    if (!this.currentSessionId) {
      throw new Error('No active chat session. Please start a new journey.');
    }

    const headers = this.getAuthHeaders();
    // Assuming backend takes the message in the body as a simple string or JSON
    // Adjust payload structure if the backend expects a different model (e.g. { message: text })
    return this.http.post<any>(
      `http://localhost:5000/api/Chat/send`,
      { sessionId: this.currentSessionId, message: text },
      { headers }
    ).pipe(
      tap(response => {
        this.addAssistantReply(response.message, response.plan);
      })
    );
  }

  loadUserSessions(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>('http://localhost:5000/api/Chat/sessions', { headers }).pipe(
      tap(sessions => this.history = sessions),
      catchError(err => { console.error('Failed to load sessions', err); return of([]); })
    );
  }

  loadSessionChat(sessionId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`http://localhost:5000/api/Chat/history/${sessionId}`, { headers }).pipe(
      tap(messages => {
        this.currentSessionId = sessionId;
        this._messages.set(messages);
      })
    );
  }

  reset(): void {
    this.currentSessionId = null;
    this._messages.set([]);
    // Automatically create a new session
    this.createSession().subscribe({
      error: (err) => console.error('Failed to create session:', err)
    });
  }

  private getAuthHeaders(): HttpHeaders {
    // Dynamically and synchronously read the active token from localStorage
    const token = localStorage.getItem('token');
    
    console.log('DEBUG: Token retrieved from storage is:', token);
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token && token.trim() !== '') {
      // Ensure strict Bearer schema prefix format
      headers = headers.set('Authorization', `Bearer ${token.trim()}`);
    } else {
      console.warn('DEBUG: No valid token found in storage. Skipping Authorization header injection.');
    }
    
    return headers;
  }

  // --- internals ---

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
}
