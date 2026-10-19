# AuraPass Release 1 — Part 1

## Scope
Apply the uploaded release to the existing application:
- Show sold-out ticket categories and keep availability current while an event page is open.
- Let organisers remove a posted ticket category through the existing removal function, preserving already-purchased tickets.
- Remove the unset-username reminder.
- Add an admin page to select, order and save up to eight homepage featured events; retain the upcoming-event fallback.
- Repair event-specific WhatsApp previews for slug and legacy ID links.
- Add banner scanning and one-click optimisation, plus compression before new uploads.

## Application rules
- All existing-file, non-generated patch hunks match the current source; the five proposed new files are absent.
- Apply the supplied changes literally; stop and report any subsequent context mismatch.
- Do not write or execute SQL, enable Lovable Cloud, change payment logic, or modify generated integration types.
- Preserve existing navigation, brand tokens, access checks and event-management behaviour.

## Technical details
- Use the existing clients and the database functions the brief states were already deployed.
- Create new dependency files before adding imports that use them.
- Let TanStack regenerate the route tree; do not hand-edit it or make Git commits manually.
- Include required page title, description and social metadata on the new admin page and complete the event-page fallback metadata; these are the only additions beyond the supplied implementation diff.
- Record the new structural rules in project notes and keep a focused release checklist.

## Verification
- Check the resulting source diff and each verification item in the attachment.
- Add and run focused tests for sold-out eligibility, archived-category price exclusion and the eight-feature limit, without changing business rules.
- Check homepage fallback, event availability and guest ticket navigation in the running application.
- Test admin selection/reordering/saving and organiser category removal only when an appropriate signed-in account is available; avoid destructive changes to real events without permission.
- Report changed files and clearly distinguish source/browser checks from unverified database or real WhatsApp behaviour. Do not claim a GitHub commit or deployment that was not performed.