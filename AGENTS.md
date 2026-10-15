# Project rules
- Organiser event insights live within the existing event-management page and use owner-scoped browser reads; preserve existing management routes and cancellation approval logic.
- Event overview figures and charts must derive from confirmed orders, not reserved stock or reference/demo figures, so unpaid reservations are never presented as sales.
- Organiser page-return controls use the shared OrganiserBackButton with router history and parent fallback; form-step controls remain local to avoid abandoning in-progress forms.
- Selected event management is encoded in the events page's eventId search parameter so history preserves the list-to-management-to-tool navigation flow.
- Sales window generation stays in the browser-safe organiser-sales-chart module, separate from unchanged order revenue calculations, for deterministic date-range testing.