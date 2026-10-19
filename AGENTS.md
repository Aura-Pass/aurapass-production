# Project rules
- Release 1 availability polling and featured-event reads use focused browser-safe hooks and existing RPCs; this preserves stock privacy and avoids schema changes.
- Banner compression is shared between new uploads and admin optimisation in a browser-only helper; this keeps image processing out of the server runtime.
- Organiser event insights live within the existing event-management page and use owner-scoped browser reads; preserve existing management routes and cancellation approval logic.
- Event overview figures and charts must derive from confirmed orders, not reserved stock or reference/demo figures, so unpaid reservations are never presented as sales.
- Organiser page-return controls use the shared OrganiserBackButton with router history and parent fallback; form-step controls remain local to avoid abandoning in-progress forms.
- Selected event management is encoded in the events page's eventId search parameter so history preserves the list-to-management-to-tool navigation flow.
- Sales window generation stays in the browser-safe organiser-sales-chart module, separate from unchanged order revenue calculations, for deterministic date-range testing.
- Homepage feature navigation lives in its own browser-safe carousel and reuses existing public event/artist hooks; this keeps homepage presentation independent of backend and checkout logic.
- Homepage decorative video is isolated in HomeHeroVideo with one media configuration referencing static Lovable asset pointers, poster-first loading and browser visibility/preference gates; layout is independent of footage aspect ratio so replacement media leaves carousel, search, navigation and playback safeguards unchanged, with the poster retained when the browser cannot decode or autoplay it.