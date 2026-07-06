import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../core/constants/routes';
import { Navbar } from '../../layout/navbar/navbar';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../core/utils/http-error';
import { ChatMessage, ChatSession } from '../../core/models';

/** A time-bucketed group of history sessions for the sidebar. */
interface HistoryGroup {
  label: string;
  items: ChatSession[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, Navbar],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatPage implements AfterViewChecked, OnInit, OnDestroy {
  private readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLInputElement>;

  newMessageText = '';
  isAssistantTyping = false;

  private renderedCount = 0;

  get messages(): ChatMessage[] {
    return this.chat.messages();
  }
  get suggestions(): string[] {
    return this.chat.suggestions;
  }
  get activeSessionId(): string | null {
    return this.chat.activeSessionId();
  }
  get isEmptyState(): boolean {
    return this.messages.length <= 1 && !this.isAssistantTyping;
  }

  /** History grouped into "This Week" / "Earlier" for the sidebar. */
  get historyGroups(): HistoryGroup[] {
    const now = Date.now();
    const thisWeek: ChatSession[] = [];
    const earlier: ChatSession[] = [];
    for (const item of this.chat.history()) {
      const t = new Date(item.date).getTime();
      if (!isNaN(t) && now - t < WEEK_MS) {
        thisWeek.push(item);
      } else {
        earlier.push(item);
      }
    }
    return [
      { label: 'This Week', items: thisWeek },
      { label: 'Earlier', items: earlier },
    ].filter((g) => g.items.length > 0);
  }

  ngOnInit(): void {
    if (this.messages.length === 0 || !this.chat.hasActiveSession()) {
      this.chat.createSession().subscribe({
        error: (err) => console.error('Failed to initialize chat session', err),
      });
    }
    this.chat.loadUserSessions().subscribe();
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.renderedCount) {
      this.renderedCount = this.messages.length;
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {}

  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (!text || this.isAssistantTyping) return;

    // A brand-new trip is only expected while no trip is yet linked to this
    // conversation; once linked, follow-up messages edit the same trip.
    const isNewTrip = !this.chat.currentTripId();

    this.chat.addUserMessage(text);
    this.newMessageText = '';
    this.isAssistantTyping = true;

    this.chat.sendMessage(text).subscribe({
      next: (response) => {
        this.isAssistantTyping = false;
        // Refresh the sidebar so a newly-created session appears and the
        // backend-generated title/order are reflected immediately.
        this.chat.loadUserSessions().subscribe();

        if (response.tripId && isNewTrip) {
          // Hand off to the trip page, which owns the single generation loader
          // and polls for the itinerary — avoids a second loader here.
          this.router.navigate([APP_ROUTES.myTrips, response.tripId], {
            queryParams: { generating: 1 },
          });
        }
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.isAssistantTyping = false;
        this.chat.addSystemErrorMessage(
          'Sorry, something went wrong while reaching the server. Please try again.',
        );
        this.toast.danger(extractErrorMessage(err, 'Failed to send message. Please try again.'));
      },
    });
  }

  loadHistoricalSession(session: ChatSession): void {
    // Restore BOTH the session id and its linked trip so a follow-up message
    // continues the same backend conversation and keeps editing the same trip.
    this.chat.loadSessionChat(session.id, session.tripId ?? null).subscribe({
      next: () => this.focusComposer(),
      error: (err) => this.toast.danger(extractErrorMessage(err, 'Failed to load chat history.')),
    });
  }

  selectSuggestion(prompt: string): void {
    this.newMessageText = prompt;
    this.sendMessage();
  }

  startNewChat(): void {
    this.chat.reset();
    this.focusComposer();
  }

  goToTrips(): void {
    this.router.navigate([APP_ROUTES.myTrips]);
  }

  savePlan(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.danger('Please sign in to save this plan.');
      this.router.navigate([APP_ROUTES.login], { queryParams: { returnUrl: APP_ROUTES.chat } });
      return;
    }
    this.toast.success('Plan saved to your trips!');
  }

  private focusComposer(): void {
    setTimeout(() => this.composerInput?.nativeElement.focus(), 0);
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
