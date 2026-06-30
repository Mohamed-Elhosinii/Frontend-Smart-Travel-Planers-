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
    if (this.messages.length === 0 || !this.chat.hasActiveSession()) {
      this.chat.initLocalSession();
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

    const isNewTrip = !this.chat.currentTripId(); // ← قبل الإرسال

    this.chat.addUserMessage(text);
    this.newMessageText = '';
    this.isAssistantTyping = true;

    this.chat.sendMessage(text).subscribe({
      next: (response) => {
        this.isAssistantTyping = false;

        if (response.tripId && isNewTrip) {
          // ← بس لو رحلة جديدة
          this.awaitPlan(response.tripId);
        }
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.isAssistantTyping = false;
        this.chat.addSystemErrorMessage(
          'عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
        );
        this.toast.danger('Failed to send message. Please try again.');
      },
    });
  }

  private awaitPlan(tripId: string): void {
    this.isAssistantTyping = true;

    this.tripService.pollPlan(tripId).subscribe({
      next: () => {
        this.isAssistantTyping = false;
        this.router.navigate(['/my-trips', tripId]);
      },
      error: () => {
        this.isAssistantTyping = false;
        this.chat.addSystemErrorMessage('تأخرت الخطة، حاول تاني');
        this.toast.danger('Your plan is taking longer than expected. Please try again.');
      },
    });
  }

  loadHistoricalSession(sessionId: string): void {
    this.chat.loadSessionChat(sessionId).subscribe({
      error: () => this.toast.danger('Failed to load chat history.'),
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