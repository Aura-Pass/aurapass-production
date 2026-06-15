import { MOCK_EVENTS } from "@/constants/mockEvents";
import type { Event } from "@/types";

// Placeholder hook — real data layer will be wired in a later module.
export function useEvents(): { events: Event[]; isLoading: boolean } {
  return { events: MOCK_EVENTS, isLoading: false };
}
