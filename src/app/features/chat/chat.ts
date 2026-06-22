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

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

  newMessageText = '';
  isAssistantTyping = false;
  isRedirecting = false;

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
          this.isRedirecting = true;
          setTimeout(() => {
            this.router.navigate(['/my-trips', response.tripId]);
          }, 2000);
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
