# Personal OS — Build Spec (Phase 1)

**Status:** Living document — update as decisions get made
**Priority order:** Phase 1 (this doc) fully solid before Phase 2 (Admiral Pat AI layer)

---

## 1. Vision

A Personal Operating System used daily — not just a fishing AI project. Two phases:

- **Phase 1 — Personal Dashboard:** mobile app + wall-mounted "Mission Control" display (TV + mini PC), covering Tasks, Notes, Daily Planner, Calendar, Shopping Lists, Fishing Journal, Project Roadmap, Ideas/Brain Dumps. Must be fully useful standalone.
- **Phase 2 — Admiral Pat AI:** an optional intelligent layer on top once Phase 1 is stable. Reads the journal/tasks, suggests priorities, updates the dashboard. Never a dependency — every Phase 1 feature stays useful with Pat switched off.

## 2. Design Principles

- Mobile-first
- Offline-first where possible
- Modular architecture — each feature is its own self-contained piece
- No paid/cloud services required
- Build solid foundations before advanced AI features

---

## 3. Architecture (Settled)

**Server:** Node.js/Express on the mini PC ("Mission Control"), WebSocket for live sync, JSON files on disk for storage. This is the source of truth — phone app and wall dashboard are both just views onto it.

**Phone app:** Single React-via-CDN HTML page served as a PWA. Dark ship's-log aesthetic — near-black (#12161A), brass/amber (#C98A3F), Oswald + IBM Plex Mono + Inter fonts.

**Wall dashboard (Mission Control display):** TV + mini PC, shows an at-a-glance view — today's tasks, current projects, calendar, fishing plans, weather, shopping list, project progress, important reminders. Designed to be understood without touching the phone.

**Sync model (settled):** **local-first, sync when available.**
- Every module writes locally first, always — the app must be fully usable with zero connection to Mission Control.
- When on the same network as Mission Control, changes sync live via WebSocket (as Notes/Idea Dump already do).
- When away from Mission Control's network (e.g. out fishing), changes queue locally and sync opportunistically once back in range.
- This is the one architectural rule every module must follow — it's the hard part to retrofit later, so it's a requirement from the start, not an optimization.

---

## 4. Current Status

| Module | Status |
|---|---|
| Notes | ✅ Working, live cross-device sync |
| Idea Dump | ✅ Working, live cross-device sync (idea → note promote). Needs extending: promote to Task or Roadmap entry too (settled decision — see Claude_Code_Handoff.md item 13), keeping the original idea marked as promoted rather than deleted |
| Fishing Journal | ✅ Built standalone (browser localStorage), full featured — needs porting to the local-first + Mission Control sync model |
| Tasks | 🔲 Not started |
| Daily Planner | 🔲 Not started |
| Calendar | 🔲 Not started |
| Shopping List | 🔲 Not started |
| Project Roadmap | ✅ Built locally — needs "pin to dashboard" toggle added (see Section 6) before wall dashboard can consume it |
| Wall dashboard | 🔲 Not started |

---

## 5. Build Order (Recommended)

1. **App shell** — navigation between modules, no functionality yet, just the frame
2. **Port the Fishing Journal** into the local-first + Mission Control sync pattern — proves the whole sync model end-to-end using a module that's already fully designed, lowest-risk way to validate the pattern
3. **Wall dashboard v1** — get the Fishing Journal (and Notes/Idea Dump) displaying on Mission Control, proving the phone ↔ server ↔ dashboard loop actually works
4. **Remaining modules**, one at a time, each following the same now-proven pattern: Tasks → Daily Planner → Calendar → Shopping List → Project Roadmap
5. **Phase 2 — Admiral Pat AI** layer on top, once all of Phase 1 is stable and used daily

---

## 6. Wall Dashboard Layout (Settled)

**Priority order (user-specified):** Weather = small/glanceable. Active Projects + Today's Tasks = equal top priority, largest zones. Everything else (Calendar, Shopping List, Fishing Plans, Reminders) = secondary strip, present but visually quiet.

**Layout:**
- **Top bar:** compact weather + date/time, small footprint
- **Hero row, left:** 2-3 Active Project cards, stacked — each shows project name, progress bar/%, and next milestone
- **Hero row, right:** Today's Tasks — checklist style, overdue items visually flagged, completion count/progress bar at the bottom
- **Secondary strip, bottom:** Calendar preview, Shopping List count, Fishing Plans, Reminders — smaller cards, equal weight to each other, all subordinate to the hero row

**Project pinning (settled): manual, not automatic.** Which 2-3 projects appear on the dashboard is chosen by hand from the Project Roadmap module — not auto-selected by recent activity or any other heuristic. The user wants to deliberately chop and change what's shown depending on what they're actively focused on that week, so the Roadmap module needs a "pin to dashboard" toggle per project, capped at 2-3 pinned at once. The topmost/first-pinned project gets slightly stronger visual emphasis (accent border) to mark it as the current main focus.

**Interactivity (settled): read-only / display-only.** The wall dashboard is a TV with no touchscreen — it displays live data from Mission Control but isn't used for input. All editing (tasks, journal entries, pinning projects, etc.) happens on the phone app. Simpler to build, and matches how the dashboard is actually meant to be used — glance and understand, not interact with directly.

**Future upgrade path:** since the dashboard is just a webpage in a browser, a touchscreen swap later would work with zero architecture change — touch events work the same as clicks natively. The only real work at that point would be designing actual tappable UI elements, since V1 has none. Worth keeping in mind but not a V1 concern.

**Mockup:** see `mission-control-dashboard-layout.svg` for the visual reference.

---

## 7. Open Decisions (Not Yet Settled)

- Exact conflict-resolution rule when offline changes sync back and something changed on Mission Control in the meantime (last-write-wins is simplest, may not always be right)
- Whether the wall dashboard needs any input capability of its own, or stays read-only/display-only
- ~~Authentication~~ — **settled:** two layers. Tailscale ACLs control which network path can reach Mission Control at all (see Section 8); a simple shared-password login on the server itself controls who can act once on that path. No longer "local network only" since Tailscale extends reachability beyond the physical LAN.

## 8. Multi-User Access (Planned — Not Yet Built)

**Use case:** a friend needs access to just the Fishing Journal module — not the rest of the dashboard — so he can log his own solo sessions and catches, with yours and his kept separately attributed.

**Access method (settled, build later):** Tailscale — private mesh VPN, add his device to the network, use Tailscale ACLs to restrict him to just the journal route rather than the full dashboard. No port forwarding or public exposure needed. (Cloudflare Tunnel and a separate hosted instance were considered as alternatives — Tailscale is the simplest starting point and doesn't block moving to one of those later if needed.)

**Trigger condition (settled):** his access doesn't get set up until Mission Control is internet-connected — no point building remote access to a machine that's still local-only. Once it's online, Tailscale gets configured and he's added.

**Interim workaround, until then:** he can log sessions on his own phone using a copy of the app (local storage only, same as before Mission Control existed). Next time you're together in person, both phones sync through Mission Control (or directly, if simpler) and his entries merge in — same local-first, sync-when-available pattern the whole app already follows, just with a longer gap between syncs than usual. Attribution (`angler` field) still matters here so merged entries are correctly credited even though the sync happened in person rather than live.

**Data model requirement (settled, build into the Journal before multi-user access goes live):**
- Every **catch** needs an `angler` field — whose catch it was, not just which session it belongs to
- Every **session** needs a `sessionType` field — `Solo` or `Paired` (or similar), so you can tell at a glance whether a session was fished alone or together
- This should go in before real multi-user access is wired up, since retrofitting attribution onto existing data later is more error-prone than building it in from the start

**Status:** not yet implemented in the Journal — tracked here and in `Fishing_Journal_Future_Features.md` for when this gets picked up.

---

*Update this doc as decisions get made — treat it as the reference instead of re-deriving architecture from chat history each time.*
