# Personal OS — Claude Code Handoff

## Setup

1. Create a project folder (e.g. `personal-os/`)
2. Copy these files into it:
   - `personal-os-shell.html` (the current app — working prototype)
   - `Personal_OS_Build_Spec.md` (architecture decisions)
   - `Fishing_Journal_Future_Features.md` (backlog for the Journal module)
   - `Admiral_Pat_Build_Spec.md` (Phase 2 reference — not active work yet)
3. Open `claude` in that folder and paste the prompt below.

---

## Prompt to paste into Claude Code

```
Project: Personal OS (mobile-first personal dashboard app)

I've been prototyping this in Claude chat as a single HTML file with
inline CSS/JS (no build tooling, React-free, vanilla JS). It works but
the file is now 1,800+ lines and getting expensive to keep editing
through chat. I want to continue development with you instead.

Read Personal_OS_Build_Spec.md first for the full architecture and
design principles — treat it as the source of truth, not this prompt.

Current state: personal-os-shell.html is a working prototype with six
modules, all using localStorage (no backend yet):
- Fishing Journal (most complex — sessions containing catches, kit
  inventory, pre-trip checklist, photo support, GPS, gallery, search)
- Task Manager (priority, due dates, active/completed)
- Daily Planner (date-based time-blocked entries)
- Calendar (month view, tap-to-add events per day)
- Shopping List (active/bought)
- Project Roadmap (status pills: Idea/Planning/In Progress/Done)

Two more modules exist already in a separate, more mature build
(referenced in the spec but not in this file) that still need
porting in: Notes and Idea Dump, both with live cross-device sync
via a Node/Express + WebSocket server on a machine called "Mission
Control." That backend is not yet set up (hardware is ready — Dell
thin client wiped and being reimaged with Ubuntu Server — but the
server itself hasn't been built yet).

What I'd like your help with, roughly in priority order:

1. Restructure the codebase properly — separate files/components per
   module instead of one giant HTML file, while keeping it easy for
   me to understand and edit (I'm not an experienced coder). Explain
   your structure choices as you go.

2. Build the Mission Control server (Node/Express + WebSocket, JSON
   file storage) and wire the existing modules to sync through it,
   following the "local-first, sync when available" rule in the spec
   — every module must keep working fully offline.

3. Build a wall dashboard view (separate route/page from the phone
   app, meant for a TV) per Section 6 of the spec: read-only/display-
   only, no input capability. Layout: compact weather+clock bar up
   top, 2-3 "Active Project" cards (manually pinned via a toggle I'll
   add to the Project Roadmap module — see item 5 below) plus Today's
   Tasks as equally-sized hero zones, and a secondary strip below for
   Calendar/Shopping List/Fishing Plans/Reminders. Visual reference:
   mission-control-dashboard-layout.svg (included in this folder).

4. Port in the Notes and Idea Dump modules once the server exists.

5. Add a "pin to dashboard" toggle to the Project Roadmap module
   (max 2-3 pinned at once, first-pinned gets an accent-border visual
   treatment as the "current main focus" project on the dashboard).

6. Fishing Journal needs `angler` and `sessionType` (Solo/Paired)
   fields added to its data model now, ahead of a friend eventually
   getting scoped access to just that module via Tailscale once
   Mission Control is internet-connected (not needed yet — see
   Section 8 of the spec for the full plan, including an interim
   workaround where he runs a separate local copy and we manually
   merge entries when we're together in person, so the data model
   needs to support merging two independently-logged histories
   without ID collisions).

7. Known open item from the spec (Section 7): conflict resolution
   for offline edits syncing back — last-write-wins is the simple
   default but flag if you think it's wrong for any specific module.

8. Make this run as close to one-click as possible on the thin
   client, since I'll be managing it remotely most of the time, not
   sitting at it. Specifically:
   - The Mission Control server should start automatically on boot
     (systemd service) and restart itself if it crashes, not need me
     to manually run a command after every reboot
   - The wall dashboard should auto-launch on boot too: auto-login,
     then Chromium in kiosk mode pointed straight at the dashboard
     page, no manual steps to get from power-on to the dashboard
     showing on screen
   - Please set up whatever's needed for both of these (systemd unit
     files, autostart config, etc.) as part of this build, not left
     as instructions for me to do by hand afterward

9. Set this up under git version control from the start (I've
   already run git init and pushed the current files to a private
   GitHub repo). Commit as you go so I can roll back if a
   restructure goes wrong, rather than one giant uncommitted change.

10. Set up automated backups of Mission Control's data (the JSON
    files): a scheduled job (cron + rsync or similar) that pushes a
    copy of the JSON data directory from Mission Control to my main
    machine on a regular basis (nightly is fine). This is local
    infrastructure, not user-facing — just needs to exist so a Wyse
    failure doesn't mean data loss.

11. PWA cache handling: make sure that when you push an update to the
    server, the phone app actually picks up the new version rather
    than getting stuck on a stale cached copy. This is a known PWA
    pitfall — please handle cache invalidation properly rather than
    leaving it to chance.

12. Authentication: since Mission Control will be reachable via
    Tailscale (for the friend's scoped Fishing Journal access), it's
    no longer purely local-network-isolated, so this needs to be
    real rather than just a phone-level PIN. Add basic auth on the
    server itself — a simple login (single shared password is fine
    for V1) protecting the full app. This is a second, separate
    layer from the Tailscale ACL: Tailscale controls *what network
    path* can even reach the box, this auth controls *who can act*
    once they're on that path.

13. Idea Dump should support "promoting" an idea into a Task or a
    Project Roadmap entry — a simple action on an idea that creates
    the corresponding Task/Roadmap item (carrying over the text) and
    marks the original idea as promoted/converted rather than
    deleting it, so there's still a record of where it came from.

14. Touchscreen-ready dashboard: the wall dashboard may get a
    touchscreen later. It's still read-only/display-only for V1 (no
    interactive elements planned yet), but any spacing/sizing
    decisions in the layout should assume touch targets could be
    added later — don't design anything that would need reworking
    for finger-sized hit areas down the line.

15. Photos stored as separate files, not embedded: for the Fishing
    Journal's photo support, store images as separate files on disk
    (referenced by path/filename in the JSON) rather than
    base64-embedded directly in the JSON. Keeps the JSON lean and
    keeps backup/sync payloads smaller.

Please read through personal-os-shell.html and the build spec first,
then propose a restructuring plan before making changes, so I can
sanity-check the approach before you start moving things around.
```

---

## Notes for you (not part of the Claude Code prompt)

- `Admiral_Pat_Build_Spec.md` is Phase 2 — genuinely not active work. Only relevant once Phase 1 is stable and in daily use, per your own stated priority order. No need to mention it to Claude Code unless you want it aware of the eventual data-sharing plan.
- The Mission Control hardware (Ubuntu Server reimage) is a separate physical task from the software — you can hand Claude Code the software side now even before the box is finished being set up, then plug it in once both are ready.
