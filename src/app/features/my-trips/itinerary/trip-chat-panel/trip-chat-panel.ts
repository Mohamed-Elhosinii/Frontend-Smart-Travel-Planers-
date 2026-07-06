import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ENDPOINTS } from '../../../../core/config/endpoints';

interface PanelMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  time: string;
}

/** POST /api/Chat/session/trip → { sessionId } */
interface SessionResponse {
  sessionId: string;
}

/** POST /api/Chat/send → { message, tripId? } */
interface ChatSendResponse {
  message?: string;
  tripId?: string | null;
}

/** Subset of the plan used to build the welcome message. */
interface PlanSummary {
  destination: string;
  startDate: string;
  endDate: string;
}

/** GET /api/Chat/history/{id} item. */
interface HistoryItem {
  id?: string | number;
  role: string | number;
  content?: string;
  createdAt?: string;
}

/** Number of post-edit refreshes and the delay between them (business behaviour). */
const TRIP_UPDATE_POLLS = 3;
const TRIP_UPDATE_INTERVAL_MS = 6000;

@Component({
  selector: 'app-trip-chat-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './trip-chat-panel.html',
  styleUrl: './trip-chat-panel.css',
})
export class TripChatPanel implements OnInit, AfterViewChecked, OnDestroy {
  @Input({ required: true }) tripId!: string;

  @ViewChild('panelScroll') private panelScroll?: ElementRef<HTMLElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  @Output() tripUpdated = new EventEmitter<void>();

  newMessageText = '';
  isTyping = false;
  isInitializing = true;
  messages: PanelMessage[] = [];

  private panelSessionId: string | null = null;
  private idCounter = 0;
  private renderedCount = 0;
  /** Active post-edit refresh timer, tracked so it can be cleared on destroy. */
  private updateTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.initSession();
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.renderedCount) {
      this.renderedCount = this.messages.length;
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    this.clearUpdateTimer();
  }

  private initSession(): void {
    this.http
      .post<SessionResponse>(
        ENDPOINTS.chat.sessionTrip,
        { tripId: this.tripId },
        { headers: this.auth.getAuthHeaders() },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.panelSessionId = res.sessionId;
          this.loadWelcomeMessage();
        },
        error: () => {
          this.isInitializing = false;
          this.showError('Could not start the assistant. Please try again.');
        },
      });
  }

  private loadWelcomeMessage(): void {
    this.http
      .get<PlanSummary>(ENDPOINTS.chat.plan(this.tripId), { headers: this.auth.getAuthHeaders() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plan) => {
          this.isInitializing = false;
          this.messages = [
            {
              id: this.nextId(),
              sender: 'assistant',
              text: `Hi! I've got your trip to ${plan.destination} from ${plan.startDate} to ${plan.endDate}. Tell me what you'd like to change — hotel, activities, dates, budget, anything! 🧳`,
              time: this.now(),
            },
          ];
        },
        error: () => {
          // Not a problem if fetching the details fails — the session is already linked to the trip.
          this.isInitializing = false;
          this.messages = [
            {
              id: this.nextId(),
              sender: 'assistant',
              text: "Hi! Tell me what you'd like to change about your trip.",
              time: this.now(),
            },
          ];
        },
      });
  }

<<<<<<< Updated upstream
=======
  private loadHistory(sessionId: string): void {
    this.http
      .get<HistoryItem[]>(ENDPOINTS.chat.history(sessionId), { headers: this.auth.getAuthHeaders() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => {
          if (history && history.length > 0) {
            this.isInitializing = false;
            this.messages = history.map((m) => ({
              id: String(m.id || this.nextId()),
              sender: this.mapRole(m.role),
              text: m.content || '',
              time: this.formatTimeFrom(m.createdAt),
            }));
          } else {
            // If no history exists, fall back to the welcome message.
            this.loadWelcomeMessage();
          }
        },
        error: () => {
          // If history fails to load, fall back to the welcome message.
          this.loadWelcomeMessage();
        },
      });
  }

>>>>>>> Stashed changes
  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (!text || this.isTyping || !this.panelSessionId) return;

    this.messages = [
      ...this.messages,
      { id: this.nextId(), sender: 'user', text, time: this.now() },
    ];
    this.newMessageText = '';
    this.isTyping = true;

    this.http
      .post<ChatSendResponse>(
        ENDPOINTS.chat.send,
        { sessionId: this.panelSessionId, message: text },
        { headers: this.auth.getAuthHeaders() },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isTyping = false;
          this.messages = [
            ...this.messages,
            {
              id: this.nextId(),
              sender: 'assistant',
              text: response.message ?? '',
              time: this.now(),
            },
          ];

          if (response.tripId) {
            this.scheduleTripRefreshes();
          }
        },
        error: () => {
          this.isTyping = false;
          this.showError('Something went wrong. Please try again.');
          this.toast.danger('Failed to send message.');
        },
      });
  }

  /**
   * After an edit that changed the trip, the backend applies updates
   * asynchronously; refresh the itinerary a few times so the change appears.
   * Any prior timer is cleared first so rapid edits don't stack timers.
   */
  private scheduleTripRefreshes(): void {
    this.clearUpdateTimer();
    let attempts = 0;
    this.updateTimer = setInterval(() => {
      attempts++;
      this.tripUpdated.emit();
      if (attempts >= TRIP_UPDATE_POLLS) this.clearUpdateTimer();
    }, TRIP_UPDATE_INTERVAL_MS);
  }

  private clearUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private showError(text: string): void {
    this.messages = [
      ...this.messages,
      { id: this.nextId(), sender: 'system', text, time: this.now() },
    ];
  }

  private nextId(): string {
    return `p${++this.idCounter}`;
  }

  private now(): string {
    const d = new Date();
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  private scrollToBottom(): void {
    const el = this.panelScroll?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
<<<<<<< Updated upstream
}
=======

  private mapRole(role: string | number): 'user' | 'assistant' | 'system' {
    const r = typeof role === 'string' ? role.toLowerCase() : role;
    if (r === 0 || r === 'user') return 'user';
    if (r === 2 || r === 'system' || r === 3 || r === 'tool') return 'system';
    return 'assistant';
  }

  private formatTimeFrom(iso: string | null | undefined): string {
    if (!iso) return this.now();
    const hasTz = /[zZ]|[+-]\d\d:?\d\d$/.test(iso);
    const d = new Date(hasTz ? iso : iso + 'Z');
    if (isNaN(d.getTime())) return this.now();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}
>>>>>>> Stashed changes
