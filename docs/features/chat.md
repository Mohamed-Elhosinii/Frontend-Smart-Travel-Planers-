# AI Chat

Source: `src/app/features/chat/` (`ChatPage`), `core/services/chat.service.ts`

## Purpose

A conversational AI travel co-pilot. The user chats with an assistant that can
return draft itineraries inline. The "AI" is a deterministic keyword matcher
standing in for a real planning backend.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/chat` | `ChatPage` | Public | Chat thread + suggestions + history sidebar |

> Browsing the chat is public. The **only** auth-gated action is **saving a generated
> itinerary** — see [`savePlan()`](#business-logic) below.

## Workflow

1. Any visitor (signed in or not) opens `/chat` and sees a welcome message,
   suggestion chips, and a (mock) history sidebar.
2. They type a message (or click a suggestion) and send it.
3. The user message is appended; a typing indicator shows while a timer waits
   `ASSISTANT_REPLY_DELAY_MS` (1500 ms).
4. The assistant reply is appended. If the input mentions a known destination
   (the "demo planner" keywords: Rome/Italy, Tokyo/Japan, Maldives,
   Paris/France), an inline `ChatItinerary` is rendered; otherwise small-talk
   text is returned.
5. If a reply includes an itinerary, a **"Save Plan"** button is offered.
   Clicking it calls `savePlan()`: a logged-out user is toasted and redirected to
   `/login?returnUrl=/chat`; a logged-in user gets a success toast.
6. "New chat" resets the conversation to just the welcome message.

## Dependencies

- **Components:** `Navbar` (`layout/navbar`).
- **Services:** `ChatService` (`core/services/chat.service.ts`) — signal-based
  message store, `providedIn: 'root'`; `AuthService` (gating `savePlan()`),
  `ToastService` (save feedback).
- **Models:** `ChatMessage`, `ChatItinerary`, `ChatSession`.
- **Angular:** `FormsModule`, `Router` (save-plan redirect), `ViewChild`,
  `AfterViewChecked` / `OnDestroy`.

## Business logic

**`ChatService`** (the message store is a `signal`, so the conversation survives
navigation):
- `messages` — read-only signal seeded with a welcome message.
- `addUserMessage(text)` / `addAssistantReply(userText)` — append messages;
  `addAssistantReply` calls `matchItinerary` and sets `isItinerary` /
  `itineraryData` when a destination matches.
- `matchItinerary(input)` — deterministic keyword lookup returning a canned
  `ChatItinerary` for Rome, Tokyo, Maldives, or Paris (else `undefined`).
- `smallTalkReply(input)` — fallback text (budget-aware).
- `reset()` — clears back to the welcome message.
- Also exposes static `suggestions` and `history` arrays for the UI.

**`ChatPage`**
- `sendMessage()` — ignores empty input or input while the assistant is typing;
  appends the user message, sets `isAssistantTyping = true`, and schedules the
  reply on `replyTimer`. The **timer is cleared in `ngOnDestroy`** (and before
  each new send) to avoid leaks/late callbacks.
- `selectSuggestion(prompt)` — fills the input and sends.
- `startNewChat()` — calls `chat.reset()`.
- `savePlan()` — **the app's sole auth-gated action.** If
  `auth.isLoggedIn()` is `false`, it raises `toast.danger('Please sign in to save
  this plan.')` and `router.navigate(['/login'], { queryParams: { returnUrl:
  '/chat' } })`; otherwise it raises `toast.success('Plan saved to your trips!')`.
  This is the only place authentication is enforced now that routes are public.
- `ngAfterViewChecked()` — **scrolls to the bottom only when a message was
  actually added** (compares `messages.length` to `renderedCount`), so the user
  can scroll up freely.

## Notes / future work

- Replace `generateAssistantReply` / `matchItinerary` with a streaming API call
  to make the assistant real.
- `history` is static mock data and does not load past conversations.
