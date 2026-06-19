/** A compact itinerary rendered inline inside an assistant chat message. */
export interface ChatItinerary {
  destination: string;
  duration: string;
  budget: string;
  days: {
    dayNum: number;
    title: string;
    activities: string[];
  }[];
}

/** A single message in the AI chat conversation. */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  /** Display timestamp, e.g. "03:00 PM". */
  time: string;
  isItinerary?: boolean;
  itineraryData?: ChatItinerary;
}

/** A saved past conversation shown in the chat history sidebar. */
export interface ChatSession {
  id: string;
  title: string;
  date: string;
}
