import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { ASSISTANT_REPLY_DELAY_MS, ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ChatMessage, ChatSession } from '../../core/models';

/** AI travel-assistant chat. State and the demo planner live in {@link ChatService}. */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, Navbar],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatPage implements AfterViewChecked, OnDestroy {
  private readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

  newMessageText = '';
  isAssistantTyping = false;

  private replyTimer?: ReturnType<typeof setTimeout>;
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

  ngAfterViewChecked(): void {
    // Only scroll when a message is actually added, so users can scroll up freely.
    if (this.messages.length !== this.renderedCount) {
      this.renderedCount = this.messages.length;
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.replyTimer);
  }

  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (!text || this.isAssistantTyping) return;

    this.chat.addUserMessage(text);
    this.newMessageText = '';
    this.isAssistantTyping = true;

    clearTimeout(this.replyTimer);
    this.replyTimer = setTimeout(() => {
      this.isAssistantTyping = false;
      this.chat.addAssistantReply(text);
    }, ASSISTANT_REPLY_DELAY_MS);
  }

  selectSuggestion(prompt: string): void {
    this.newMessageText = prompt;
    this.sendMessage();
  }

  startNewChat(): void {
    this.chat.reset();
  }

  /**
   * Save a generated itinerary. This is the one action that requires an account:
   * logged-out users are sent to sign in first (and returned here afterwards).
   */
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
