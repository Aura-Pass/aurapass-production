import { MOCK_EVENTS, type MockEvent } from "@/constants/mockEvents";

// Placeholder hook — real data layer will be wired in a later module.
export function useEvents(): { events: MockEvent[]; isLoading: boolean } {
  return { events: MOCK_EVENTS, isLoading: false };
}
