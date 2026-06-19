import { Injectable, signal } from '@angular/core';
import { ChatItinerary, ChatMessage, ChatSession } from '../models';

/** Delay (ms) used by the UI to simulate the assistant "thinking". */
export const ASSISTANT_REPLY_DELAY_MS = 1500;

/**
 * Chat state and the demo itinerary planner.
 *
 * The "AI" here is a deterministic keyword matcher standing in for a real
 * planning backend. The message store is a signal so the conversation survives
 * navigation. Replace {@link generateAssistantReply} with a streaming API call
 * to make it real.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private idCounter = 0;

  private readonly _messages = signal<ChatMessage[]>([this.welcomeMessage()]);
  readonly messages = this._messages.asReadonly();

  readonly suggestions: string[] = [
    'Plan a 3-day cultural tour in Rome',
    'Suggest a budget-friendly week in Tokyo',
    'Generate a luxury 5-day escape to Maldives',
    'Recommend food spots and cafes in Paris',
  ];

  readonly history: ChatSession[] = [
    { id: 'h1', title: 'Summer in Paris Plan', date: 'June 15, 2026' },
    { id: 'h2', title: 'Rome 4-Day History Tour', date: 'June 10, 2026' },
    { id: 'h3', title: 'Maldives Beach Getaway', date: 'May 28, 2026' },
  ];

  /** Append a user message to the conversation. */
  addUserMessage(text: string): void {
    this.append({
      id: this.nextId(),
      sender: 'user',
      text,
      time: this.currentTime(),
    });
  }

  /** Build (and append) the assistant's reply to the given user input. */
  addAssistantReply(userText: string): void {
    const itinerary = this.matchItinerary(userText);
    this.append({
      id: this.nextId(),
      sender: 'assistant',
      text: itinerary
        ? "Here's a draft itinerary from the TripMind demo planner:"
        : this.smallTalkReply(userText),
      time: this.currentTime(),
      isItinerary: !!itinerary,
      itineraryData: itinerary,
    });
  }

  /** Clear the conversation and start fresh. */
  reset(): void {
    this._messages.set([this.welcomeMessage()]);
  }

  // --- internals ---

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
      text: 'Hi, I am your TripMind AI co-pilot. Tell me where you want to go, how long you have, and the travel style you prefer.',
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

  private smallTalkReply(userInput: string): string {
    const input = userInput.toLowerCase();
    if (input.includes('budget') || input.includes('cost')) {
      return 'For a tighter budget I recommend public transport and local street food. Tell me the destination and trip length and I can draft a full breakdown.';
    }
    return 'Got it! To build a tailored plan, share your destination, travel dates, nightly budget, or any must-see sights.';
  }

  private matchItinerary(userInput: string): ChatItinerary | undefined {
    const input = userInput.toLowerCase();
    if (input.includes('rome') || input.includes('italy')) {
      return {
        destination: 'Rome, Italy',
        duration: '3 Days',
        budget: 'EUR 450 (Moderate)',
        days: [
          { dayNum: 1, title: 'Ancient Rome Explorations', activities: ['Visit Colosseum & Roman Forum', 'Gelato break near Piazza Navona', 'Walk up the Spanish Steps', 'Dinner in Trastevere district'] },
          { dayNum: 2, title: 'Vatican City & Renaissance Art', activities: ['Guided tour of Vatican Museums & St. Peter\'s Basilica', 'Stroll along Castel Sant\'Angelo', 'Make a wish at Trevi Fountain'] },
          { dayNum: 3, title: 'Scenic Views & Roman Culture', activities: ['Explore Villa Borghese Gardens & Galleria', 'Panoramic views from Janiculum Hill', 'Enjoy a traditional Pasta Carbonara class'] },
        ],
      };
    }
    if (input.includes('tokyo') || input.includes('japan')) {
      return {
        destination: 'Tokyo, Japan',
        duration: '7 Days',
        budget: 'JPY 120,000 (Budget-friendly)',
        days: [
          { dayNum: 1, title: 'Modern Marvels of Shinjuku', activities: ['Explore Shinjuku Golden Gai', 'Panoramic view from the Metropolitan Government Building'] },
          { dayNum: 2, title: 'Tradition meets Pop Culture', activities: ['Visit Senso-ji Temple in Asakusa', 'Shopping in Akihabara Electric Town', 'Stroll through Ueno Park'] },
          { dayNum: 3, title: 'Youth Culture & Trendy Districts', activities: ['Walk Shibuya Crossing', 'Visit Meiji Shrine & Harajuku', 'Dinner in Omotesando'] },
        ],
      };
    }
    if (input.includes('maldives')) {
      return {
        destination: 'Maldives Island Resort',
        duration: '5 Days',
        budget: '$2,800 (Premium Luxury)',
        days: [
          { dayNum: 1, title: 'Tropical Welcome', activities: ['Speedboat transfer to overwater villa', 'Welcome drinks & sunset beach walk', 'Private deck dining'] },
          { dayNum: 2, title: 'Underwater Adventures', activities: ['Morning guided snorkeling safari', 'Relaxing Balinese spa treatment', 'Beachside cinema screening'] },
          { dayNum: 3, title: 'Local Culture & Sailing', activities: ['Sunset catamaran cruise with dolphin watching', 'Traditional Maldivian night & buffet'] },
        ],
      };
    }
    if (input.includes('paris') || input.includes('france')) {
      return {
        destination: 'Paris, France',
        duration: '4 Days',
        budget: 'EUR 680 (Moderate)',
        days: [
          { dayNum: 1, title: 'Iconic Monuments', activities: ['Eiffel Tower summit access', 'Seine River sightseeing cruise', 'Stroll along the Champs-Élysées'] },
          { dayNum: 2, title: 'Art & Bohemian Vibes', activities: ['Visit the Louvre Museum', 'Walk up Montmartre to Sacré-Cœur', 'Café dining in the Latin Quarter'] },
          { dayNum: 3, title: 'Royal Gardens & Strolling', activities: ['Palace of Versailles day trip', 'Relax at Jardin du Luxembourg', 'Dinner at a traditional French bistro'] },
        ],
      };
    }
    return undefined;
  }
}
