import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

interface PanelMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  time: string;
}

@Component({
  selector: 'app-trip-chat-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './trip-chat-panel.html',
  styleUrl: './trip-chat-panel.css',
})
export class TripChatPanel implements OnInit, AfterViewChecked {
  @Input({ required: true }) tripId!: string;

  @ViewChild('panelScroll') private panelScroll?: ElementRef<HTMLElement>;

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  @Output() tripUpdated = new EventEmitter<void>();

  newMessageText = '';
  isTyping = false;
  isInitializing = true;
  messages: PanelMessage[] = [];

  private panelSessionId: string | null = null;
  private idCounter = 0;
  private renderedCount = 0;

  ngOnInit(): void {
    this.initSession();
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.renderedCount) {
      this.renderedCount = this.messages.length;
      this.scrollToBottom();
    }
  }

  private initSession(): void {
    this.http
      .post<any>(
        '/api/Chat/session/trip',
        {
          tripId: this.tripId,
        },
        { headers: this.authHeaders() },
      )
      .subscribe({
        next: (res) => {
          this.panelSessionId = res.sessionId;
          this.loadHistory(res.sessionId);
        },
        error: () => {
          this.isInitializing = false;
          this.showError('تعذر تشغيل المساعد، حاول تاني.');
        },
      });
  }

  /**
   * بنستخدم endpoint جديد يعمل session.TripId = tripId مباشرة في الـ DB
   * (POST /api/Chat/session/link-trip).
   * كده الـ backend هيشوف إن الرحلة موجودة من أول رسالة، وكل الـ
   * TRIP_UPDATE_HOTEL / TRIP_UPDATE_ACTIVITIES / TRIP_UPDATE_FLIGHT
   * هتشتغل صح بدون أي context message وهمية.
   */
  private linkSessionToTrip(): void {
    this.http
      .post<any>(
        '/api/Chat/session/link-trip',
        { sessionId: this.panelSessionId, tripId: this.tripId },
        { headers: this.authHeaders() },
      )
      .subscribe({
        next: () => {
          // الـ session دلوقتي مربوطة فعلياً بالرحلة في الـ backend.
          // جيب بيانات الرحلة فقط عشان نعرض رسالة ترحيب — مش عشان نعلم الـ AI بيها
          this.loadWelcomeMessage();
        },
        error: () => {
          this.isInitializing = false;
          this.showError('تعذر ربط المحادثة بالرحلة، حاول تاني.');
        },
      });
  }

  private loadWelcomeMessage(): void {
    this.http.get<any>(`/api/Chat/plan/${this.tripId}`, { headers: this.authHeaders() }).subscribe({
      next: (plan) => {
        this.isInitializing = false;
        this.messages = [
          {
            id: this.nextId(),
            sender: 'assistant',
            text: `أهلاً! أنا عارف رحلتك لـ ${plan.destination} من ${plan.startDate} لـ ${plan.endDate}. قولي إيه اللي عايز تغيره — فندق، أنشطة، تواريخ، ميزانية، أي حاجة! 🧳`,
            time: this.now(),
          },
        ];
      },
      error: () => {
        // مش مشكلة لو فشل جلب التفاصيل — الـ session اتربطت بالفعل بالـ tripId
        this.isInitializing = false;
        this.messages = [
          {
            id: this.nextId(),
            sender: 'assistant',
            text: 'أهلاً! قولي إيه التعديل اللي عايز تعمله في رحلتك.',
            time: this.now(),
          },
        ];
      },
    });
  }

  private loadHistory(sessionId: string): void {
    this.http.get<any[]>(`/api/Chat/history/${sessionId}`, { headers: this.authHeaders() }).subscribe({
      next: (history) => {
        if (history && history.length > 0) {
          this.isInitializing = false;
          this.messages = history.map((m: any) => ({
            id: String(m.id || this.nextId()),
            sender: this.mapRole(m.role),
            text: m.content || '',
            time: this.formatTimeFrom(m.createdAt)
          }));
        } else {
          // If no history exists, fall back to the welcome message
          this.loadWelcomeMessage();
        }
      },
      error: () => {
        // If history fails to load, fallback to welcome message
        this.loadWelcomeMessage();
      }
    });
  }

  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (!text || this.isTyping || !this.panelSessionId) return;

    this.messages = [
      ...this.messages,
      {
        id: this.nextId(),
        sender: 'user',
        text,
        time: this.now(),
      },
    ];
    this.newMessageText = '';
    this.isTyping = true;

    this.http
      .post<any>(
        '/api/Chat/send',
        { sessionId: this.panelSessionId, message: text },
        { headers: this.authHeaders() },
      )
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
            let attempts = 0;
            const interval = setInterval(() => {
              attempts++;
              this.tripUpdated.emit();
              if (attempts >= 3) clearInterval(interval);
            }, 6000); // ← ابدأ بعد 8 ثواني وكرر 3 مرات
          }
        },
        error: () => {
          this.isTyping = false;
          this.showError('حدث خطأ، حاول تاني.');
          this.toast.danger('Failed to send message.');
        },
      });
  }

  private showError(text: string): void {
    this.messages = [
      ...this.messages,
      {
        id: this.nextId(),
        sender: 'system',
        text,
        time: this.now(),
      },
    ];
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token?.trim()) {
      headers = headers.set('Authorization', `Bearer ${token.trim()}`);
    }
    return headers;
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

  private mapRole(role: any): 'user' | 'assistant' | 'system' {
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