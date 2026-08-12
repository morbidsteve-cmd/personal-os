# Operation Tin Can — Admiral Pat AI Build Spec

**Status:** Ready to hand to Claude Code
**Roles:** User = Chief Engineer (hardware, wiring, fabrication, testing). Claude Code = Chief Software Engineer (architecture, code, docs, debugging).
**Motto:** One module. One improvement. One season at a time.

---

## 1. What This Actually Is

A personal AI fishing companion, "Admiral Pat," housed in a fabricated case ("the monster can"), running on a Raspberry Pi. Pat has:

- A voice (speaks and listens)
- A personality (Skippy-inspired arrogance, Mid-Ulster culchie accent, constant swearing, genuine warmth underneath)
- A memory (reads/writes your fishing log — The Order Library structure)
- Two operating modes: **online** (best quality, needs internet) and **offline** (works on the riverbank, no signal needed)

---

## 2. Enclosure — Final Architecture: Single Custom-Printed Can (Vertical Mount)

After working through the physical constraints, this is the settled design:

**One 3D-printed can, ~90mm diameter x ~195mm tall, housing everything:**

| Section | Contents |
|---|---|
| Top cavity | Mic, speaker, USB DAC |
| Middle | Pi 5, mounted **vertically** (standing on edge, 85mm length running up the can's height) with Active Cooler |
| Base | Power wiring, and battery if going fully portable |

**Why vertical mounting matters:** Laying the Pi 5 flat across the can's diameter needs ~130mm+ to clear the board's full 85mm x 56mm face. Standing it up on edge means the diameter only has to clear the board's thin cross-section (56mm x ~25mm with cooler) — dropping the minimum viable diameter to ~80-90mm, close to real Monster can proportions.

**Port orientation:** decide early which Pi 5 ports you actually need (likely: USB-C power, USB for DAC/mic, maybe GPIO) and orient the board so those face the base access panel. Ports on the buried edge (HDMI, Ethernet, unused USB) are hard to reach post-assembly — that's fine if you don't need them live.

**Waterproofing (required — this is going out fishing):**

- **Seams**: the base/body/lid split points need proper sealing, not just friction-fit. Use silicone gasket material or O-rings at each seam, compressed by screw-together joints rather than pure friction/snap-fit.
- **Cable/port entry points**: any point where a cable or port breaks the shell (USB-C charging port, external mic if not fully internal) needs a rated waterproof gland or grommet — treat this like a boat hatch, not a phone case.
- **Speaker/mic openings**: these are the hardest part — sound needs to get in/out but water can't. Use waterproof acoustic membrane (the same kind used in phone speaker grilles and marine electronics) behind the grille cutouts rather than leaving them as bare holes.
- **Ventilation vs waterproofing conflict**: the cooler needs airflow, water needs to stay out — these fight each other. Options: a waterproof vented membrane (Gore-Tex-style, breathable but water-resistant) over vent slots, or accept a lower-airflow sealed design and rely on a larger heatsink mass instead of active airflow if full submersion resistance matters more than peak cooling.
- **Target rating**: realistically aim for **IP54-IP65** (splash/rain resistant, dust protected) rather than full submersion-proof (IP67+) — the latter is a much harder engineering problem for a DIY build with a speaker grille and charging port, and probably overkill for "gets rained on / sits near the water" rather than "gets dropped in the lough."
- **Test before you trust it**: bench-test the sealed shell with no electronics inside first (submerge/spray and check for ingress) before ever putting the Pi in it.

---

## 3. Hardware

| Item | Spec | Notes |
|---|---|---|
| Raspberry Pi | **Pi 5, 8GB RAM** | 4GB will run out of headroom once voice + local LLM are both loaded. Don't go lower. |
| Storage | 32GB+ microSD, or better: USB SSD | SSD is faster for model loading and more durable for field use. |
| Microphone | USB microphone, omnidirectional | Cheap ones are fine — the speech-to-text model handles noise better than you'd expect. |
| Speaker/Audio out | Small USB audio DAC + speaker | Onboard Pi audio is fine for bench testing, thin for the finished build. |
| Power | Official Pi 5 power supply, or a battery bank rated for it if this needs to be portable at the water | Confirm current draw if running off a power bank all day. |
| Case | Your fabrication | MIG/stick skills mean the enclosure is the easy part — just plan cutouts for mic, speaker grille, ports, and ventilation (Pi 5 runs warm under sustained LLM load; a fan or heatsink is worth including). |

Optional: Raspberry Pi AI HAT+ — adds inference acceleration, mostly helps vision workloads (a camera for auto-logging catches, if you ever want that). Not needed for the voice/text pipeline alone.

### Power Budget — Sizing for ~8 Hours

**Draw estimate:** Pi 5 alone runs ~3W idle, up to ~8.8W under full load. Add the active cooler fan, USB DAC, mic, and speaker amp, and realistic *sustained average* draw for a voice-companion workload (mostly idle/listening, periodic bursts for reasoning + TTS) lands around **7-8W average**.

**Settled approach: flat LiPo pouch cells, first attempt.**

Rather than cylindrical cells stacked below the board (which add ~60-80mm to the can's height), use thin pouch cells tucked into the leftover crescent space around the vertically-mounted board, at the same height band it already occupies — no added height to the can.

- **Realistic capacity this way:** roughly half to two-thirds of a full 6x 18650 pack, due to imperfect packing around the board and wiring/BMS clearance
- **Realistic runtime:** ~4-8 hours depending on actual usage (worst case continuous use toward the low end, real fishing-session usage — mostly idle, occasional talk — toward the high end)
- **Height:** stays at the original ~195mm design — no penalty
- **Requires a proper BMS** (battery management board) — non-negotiable for LiPo safety
- **Physical care:** pouch cells have no protective metal can (unlike 18650s) — puncture risk is real, so they need to sit padded, away from sharp edges and away from the cooler's heat

**Fallback plan, if pouch cells don't give workable capacity or don't fit safely:** revert to cylindrical cells (18650 or 21700 format — 21700 is the same idea but higher capacity per cell, worth a look too), accepting the ~60-80mm height addition in exchange for a genuinely bigger runtime margin (roughly 9-20 hours depending on usage, worked out earlier). This becomes a taller can, more "tube" than "can," but a known-working fallback if the low-height option can't deliver enough capacity in practice.

**Charging (settled):** magnetic pogo-pin connector — same approach used in dive computers and outdoor sports watches. Flush metal contact pads on the can's surface, no open port cavity to seal, self-aligning for easy docking with wet/cold hands. More power-efficient than Qi (direct contact, no wireless conversion losses) and avoids the corrosion/sealing headache of an open USB-C port. Source gold-plated contacts for corrosion resistance; a small silicone cover over the contacts when undocked is cheap extra insurance, though not strictly required for freshwater use. **Power-only (2-pin)** — no data lines through the connector.

**Software updates (settled):** over WiFi, via the same hotspot connection used for online mode — not through the charging connector. Pat checks for a new version when online, downloads it, and installs on next restart, following the approve/install/rollback discipline already established for AdmiralOS. Keeps the physical connector simple (just power) rather than adding a 4-pin data variant, which is pricier, less common, and riskier to get wrong on alignment.

---

## 4. Software Architecture

```
                    ┌─────────────────────┐
                    │   Connectivity check  │
                    └──────────┬───────────┘
                   online      │      offline
              ┌────────────────┴────────────────┐
              ▼                                  ▼
     ┌─────────────────┐              ┌──────────────────────┐
     │  Claude API       │              │  Local LLM (Ollama)    │
     │  (reasoning)       │              │  e.g. Phi-3.5 / Gemma3 │
     └────────┬──────────┘              └──────────┬────────────┘
              │                                     │
              └──────────────┬──────────────────────┘
                              ▼
                     ┌──────────────────┐
                     │   Pat persona layer │
                     │  (system prompt)     │
                     └─────────┬────────────┘
                              ▼
              ┌────────────────────────────────┐
              │      Fishing log / Order Library  │
              │   (JSON + Markdown files, read/write)│
              └────────────────────────────────┘

     Voice in:  Whisper.cpp (offline) / cloud STT (online)
     Voice out: Piper TTS (offline) / ElevenLabs (online)
```

**Mode switching logic:** check connectivity at startup and periodically; default to online when available, fall back cleanly to offline without crashing the session. Allow a manual `--offline` flag to force local mode for testing.

**Networking model (settled):** field connectivity is via **phone hotspot** — Pat and any app on your phone (The Logbook) join the same hotspot network when you're out, no separate router or home WiFi dependency. Practical implications:
- "Online mode" = hotspot has mobile signal. "Offline mode" = no mobile signal at all, not just no WiFi — this is the real trigger condition given patchy signal around Mid-Ulster loughs.
- Connectivity checks need to run continuously through a session, not just at startup — hotspots can drop and reconnect (phone locks, walks out of range if it's in a bag, etc.), so Pat needs to notice and switch modes mid-session, not get stuck.
- Running a hotspot draws down your phone's own battery over a session — worth factoring into how long your phone itself needs to last at the water.

---

## 5. The Persona Layer

This is the system prompt injected into whichever model (Claude API or local) is answering. Keep it in its own file (`persona.md` or similar) so it's easy to tune without touching code — this is the piece you'll most want to edit yourself.

**Core traits:**
- Skippy-inspired ego: brilliant, self-satisfied, never lets you forget he's right
- Mid-Ulster culchie accent in his phrasing (written in a way that reads naturally when spoken aloud by the TTS voice)
- Swears constantly and casually — "fuck" used like punctuation, never as genuine anger
- Warm underneath the abuse — affectionate slagging, not real hostility
- Deep familiarity with Operation Tin Can lore: The Order, AdmiralOS, Peg 20, Corn Gun Guy, the heavy bastard recliner, Expedition-numbered logs
- References the user's actual logged data when giving advice, not generic tips

---

## 6. Data Layer — Shared with "The Logbook" App

**Decision:** The Logbook (the standalone journal app prototyped separately) is Pat's actual logging interface — not a duplicate system. You log sessions and catches through the app, on or offline, and Pat reads that same data directly. One dataset, two ways to interact with it (typing/tapping through the app, or talking to Pat).

**Why this matters:** it means the app you've already designed and tested doesn't get thrown away when Pat is built — it becomes Pat's front-end for structured logging, while voice conversation is the front-end for everything more freeform.

### Shared schema

Both the app and Pat read/write this same structure. This is the exact shape already used in The Logbook prototype:

```json
// Session
{
  "id": "unique-id",
  "date": "YYYY-MM-DD",
  "location": "string",
  "peg": "string (optional)",
  "weather": "Sunny | Overcast | Rain | Windy | Mixed",
  "notes": "string",
  "photos": [{ "id": "unique-id", "filename": "stored on disk, referenced by filename — not base64" }],
  "catches": [ /* Catch objects, see below */ ]
}

// Catch (nested inside a session)
{
  "id": "unique-id",
  "species": "string",
  "weight": "string (free text, e.g. '4lb 2oz')",
  "length": "string (free text, e.g. '58cm')",
  "bait": "string",
  "time": "HH:MM",
  "notes": "string",
  "photos": [{ "id": "unique-id", "filename": "stored on disk, referenced by filename — not base64" }]
}

// Kit item
{ "id": "unique-id", "name": "string", "category": "string", "owned": true/false }

// Checklist item
{ "id": "unique-id", "category": "string", "label": "string", "checked": true/false }
```

**Storage location:** on the Pi, this lives as JSON files (or a lightweight local database like SQLite, if the dataset grows large) inside the Order Library structure:

```
Order/
├── Constitution.md          (rules/doctrine — keep as-is)
├── Keeper_Manual.md         (operating procedures)
├── Library_Index.md
├── Atlas/                   (locations, pegs, maps, hazards)
├── Journal/                 (sessions.json — The Logbook's data, shared with Pat)
├── Kit/                     (kit.json, checklist.json)
├── Species/
├── Research/
├── Quartermaster/           (gear inventory — mirrors Kit/ for narrative/lore entries)
├── Workshop/                (builds/mods — this project belongs here too)
├── Gallery/                 (photos linked to missions)
├── Statistics/              (auto-generated summaries)
└── Archive/
```

**How the app talks to Pat's storage:** once this is a real build (not the browser prototype), The Logbook app should write directly to these JSON files on the Pi's filesystem rather than browser localStorage — this is the one architectural change needed to move from "standalone phone app" to "Pat's actual memory." If the app runs on your phone rather than on the Pi itself, it'll need to sync to the Pi over your local network rather than writing to local storage directly — worth deciding once you know whether The Logbook ends up living on the Pi, on your phone, or both.

**What Pat does with it:** references past sessions when giving advice (pattern-spotting on location/bait/weather/species, same as before), checks your Kit list and flags anything marked "need to buy" before a trip, and can create new session/catch entries himself if you log a catch by voice instead of through the app — same schema either way, so nothing forks into two incompatible formats.

**Future feature note:** the QR-code kit-scanning idea (tracked separately in `Fishing_Journal_Future_Features.md`) plugs into this cleanly too — a scanned item just updates the same `kit.json` / `checklist.json` files Pat already reads from.

---

## 7. Build Phases

**Phase 1 — MVP (one sitting, a few hours)**
- Persona system prompt
- Claude API connection (text only, no voice yet)
- Read/write basic fishing log JSON
- Command-line chat with Pat

**Phase 2 — Voice (a session or two)**
- ElevenLabs integration for online TTS (Voice Design prompt already drafted — see below)
- Whisper.cpp for speech-to-text
- Basic mic/speaker wiring on the Pi for testing

**Phase 3 — Offline fallback (a weekend)**
- Ollama + a small local model (Phi-3.5 or Gemma3 4B recommended for the quality/speed balance on Pi 5)
- Piper TTS as the offline voice
- Connectivity detection and clean mode-switching
- Test actual response latency on the Pi itself — expect several seconds per reply offline, that's normal

**Phase 4 — The Order Library integration (ongoing)**
- Full Expedition-numbered logging
- Pattern-spotting across sessions (location/bait/weather correlations)
- Statistics auto-generation

**Phase 5 — The case (your domain)**
- Fabrication, mic/speaker placement, ventilation, power
- Final assembly and field testing

---

## 8. Voice Design Prompt (ElevenLabs)

> Middle-aged Northern Irish man from rural Mid-Ulster, thick culchie accent — flat vowels, dropped consonants, classic Ulster-Scots cadence. Cocky, self-satisfied delivery like he knows he's the smartest thing in the room and isn't shy about saying so. Fast, clipped, conversational pace — talks like he's mid-rant even when he's happy. Sarcastic, dry, biting wit. Swears constantly and casually, dropping "fuck" and "fuckin'" into sentences the way most people use commas — never shouted, just part of normal speech. Warm underneath the abuse, like a mate slagging you affectionately rather than actually raging. Think a foul-mouthed, arrogant genius holding court in a rural pub, not an angry man shouting.

Regenerate 3-5 times and pick the best take. If the accent comes back too generic, add "Tyrone/Armagh border accent, not Dublin, not Belfast city."

---

## 9. Claude Code Kickoff Prompt

Paste this into `claude` once you're in an empty project folder:

```
Project: Admiral Pat — offline/online AI fishing companion (Operation Tin Can)

Build a Python application called "pat" that acts as a personal fishing
companion AI with a strong personality (see persona.md — I'll provide this
separately). 

Core requirements:

1. Two-backend architecture:
   - Online: Anthropic API (Claude), using ANTHROPIC_API_KEY env variable
   - Offline: Local LLM via Ollama (default model: phi3.5:mini)
   - Auto-detect connectivity at startup and periodically; support a
     --offline flag to force local mode

2. Voice:
   - Online TTS: ElevenLabs API
   - Offline TTS: Piper (local, no internet)
   - Online STT: cloud (to be decided)
   - Offline STT: Whisper.cpp
   - Auto-switch based on connectivity, same as the LLM backend

3. Data layer — "The Order Library":
   - Read/write to a local folder structure (Order/Expeditions,
     Order/Atlas, Order/Quartermaster, etc. — I'll provide the full
     structure)
   - New sessions create new Expedition-numbered log files
   - Pat references past logs when giving advice (pattern-spotting on
     location/bait/weather/species)

4. Modes:
   - `pat chat` — conversational loop, voice or text
   - `pat log` — quick structured catch entry
   - `pat status` — shows current mode (online/offline), backend in use

5. Keep code simple, modular, and heavily commented — I'll be
   maintaining this myself and I'm not an experienced coder. Separate
   files per concern (persona, backend_online.py, backend_offline.py,
   voice.py, log_manager.py) rather than one giant file.

Start with Phase 1: text-only MVP using the Claude API and basic log
read/write. We'll add voice and the offline fallback in later passes.
```

---

## 10. What You Do vs What Claude Code Does

| You (Chief Engineer) | Claude Code (Chief Software Engineer) |
|---|---|
| Get API keys (Anthropic, ElevenLabs) and paste them where told | Writes every file, all the logic |
| Wire mic/speaker/power on the Pi | Explains what each piece of code does when asked |
| Fabricate the case | Proposes changes and asks permission before writing to disk |
| Test on real hardware, report what breaks | Fixes bugs, adjusts based on your feedback |
| Small tweaks you're comfortable with (API keys, volume settings, filenames) | Structural changes, new features, debugging |

---

*For the Order.*
