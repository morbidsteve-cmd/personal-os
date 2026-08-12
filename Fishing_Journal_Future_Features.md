# The Logbook — Future Features (Post-Prototype Backlog)

Ideas captured during prototyping in chat, to hand to Claude Code alongside the finished HTML prototype. Not built yet — just tracked so nothing gets lost before the real app build.

---

## 0. Shared Data Layer with Admiral Pat (SETTLED — not just an idea)

**Decision made:** The Logbook is Pat's actual logging interface, not a separate app. Both read/write the same session/catch/kit/checklist data. Full schema and storage location now documented in `Admiral_Pat_Build_Spec.md`, Section 6.

**What this means for The Logbook's own build:** when Claude Code turns this prototype into a real app, storage needs to target the shared JSON files (or sync to them) rather than being locked to browser localStorage only — this is a core requirement now, not an afterthought. Confirm this with Claude Code up front on whichever project gets built first (Pat or The Logbook standalone), since the other will need to match.

---

## 1. QR Code Kit Tracking

**Idea:** Generate a QR code for each kit item. Scan items as you load the car (or unload after a trip) to automatically check them off a "loaded" list — no manual tapping.

**Rough shape:**
- Each kit item gets a unique ID (already true in the current data model)
- App can generate/display a printable QR code per item, encoding that ID
- In-app camera scanner reads codes and matches against kit item IDs
- Scanning an item ticks it off a "packed for this trip" checklist automatically
- Kit item and checklist item should share the same underlying ID so scanning updates both in one place

**Notes:** Camera-based QR scanning works fine in-browser, but will feel smoother as a native app feature. Worth scoping as its own build pass rather than bundling into the first Claude Code version.

---

---

## 2. Angler Attribution & Solo/Paired Sessions

**Idea:** a mate will get access to just the Journal module down the line (via Tailscale — see `Personal_OS_Build_Spec.md` Section 7). Before that goes live, the data model needs:
- `angler` field on each **catch** — whose catch it was
- `sessionType` field on each **session** — Solo or Paired

**Why now, not later:** retrofitting attribution onto existing logged data is messier than building it in from the start. Worth adding this to the Journal's data model in the next pass on that module, ahead of when multi-user access actually gets wired up.

---

*Add new ideas below as they come up during prototyping.*
