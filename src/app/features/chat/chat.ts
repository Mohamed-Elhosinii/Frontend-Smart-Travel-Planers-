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
import { Navbar } from '../../layout/navbar/navbar';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ChatMessage, ChatSession } from '../../core/models';
import { TripService } from '../../core/services/trip.service';

/** AI travel-assistant chat integrated with the backend API. */
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
  private readonly tripService = inject(TripService);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

  newMessageText = '';
  isAssistantTyping = false;
  isRedirecting = false;
  isPreparingPlan = false;

  private renderedCount = 0;

  get messages(): ChatMessage[] {
    return this.chat.messages();
  }
  get chatHistory(): ChatSession[] {
    return this.chat.history;
  }
  get suggestions(): string[] {
    return this.chat.suggestions;
  }

  ngOnInit(): void {
    // Only create a new session if we don't already have one in progress
    if (this.messages.length === 0 || !this.chat.hasActiveSession()) {
      this.chat.createSession().subscribe({
        error: (err) => console.error('Failed to initialize chat session', err)
      });
    }

    // Load historical sessions for the sidebar
    this.chat.loadUserSessions().subscribe();
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.renderedCount) {
      this.renderedCount = this.messages.length;
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    // Clean up if needed
  }

  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (!text || this.isAssistantTyping) return;

    this.chat.addUserMessage(text);
    this.newMessageText = '';
    this.isAssistantTyping = true;

    this.chat.sendMessage(text).subscribe({
      next: (response) => {
        this.isAssistantTyping = false;
        
        if (response.tripId) {
          // The orchestrator builds the plan in the BACKGROUND. Don't redirect
          // yet — poll GET /api/Chat/plan/{tripId} until it's persisted (200),
          // then navigate to the trip detail page.
          this.awaitPlan(response.tripId);
        }
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.isAssistantTyping = false;
        this.chat.addSystemErrorMessage('عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
        this.toast.danger('Failed to send message. Please try again.');
      }
    });
  }

  /**
   * After a trip is triggered, the backend builds the plan asynchronously.
   * Show a "preparing" state and poll until the plan is persisted (200), then
   * redirect to its detail page. On timeout/error, keep the user in the chat
   * (history stays intact server-side) and surface a message.
   */
  private awaitPlan(tripId: string): void {
    this.isPreparingPlan = true;
    this.tripService.pollPlan(tripId).subscribe({
      next: () => {
        this.isPreparingPlan = false;
        this.isRedirecting = true;
        this.router.navigate(['/my-trips', tripId]);
      },
      error: () => {
        this.isPreparingPlan = false;
        this.chat.addSystemErrorMessage('تأخرت الخطة، حاول تاني');
        this.toast.danger('Your plan is taking longer than expected. Please try again.');
      },
    });
  }

  loadHistoricalSession(sessionId: string): void {
    this.chat.loadSessionChat(sessionId).subscribe({
      error: (err) => this.toast.danger('Failed to load chat history.')
    });
  }

  selectSuggestion(prompt: string): void {
    this.newMessageText = prompt;
    this.sendMessage();
  }

  startNewChat(): void {
    this.chat.reset();
  }

  savePlan(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.danger('Please sign in to save this plan.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/chat' } });
      return;
    }
    this.toast.success('Plan saved to your trips!');
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
