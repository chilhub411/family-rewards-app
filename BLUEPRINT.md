# Family Rewards App — Blueprint

A personal web app for managing a points-based reward, chore, and behavior system for the family. Mobile-first (iPhone / iPad), with a dedicated "wall display" mode for the hallway/kitchen iPad.

---

## 1. Overview

A single family-hosted web app with three "modes":

1. **Parent Mode** — full admin (add/deduct points, manage chores, prizes, calendar, reports)
2. **Kid Mode** — personal dashboard, chore checklist, prize store, behavior check-in
3. **Wall Display Mode** — big, glanceable, read-mostly view showing today's chores, upcoming schedule, points totals, and shared family info

---

## 2. Family Members (initial setup)

| Name  | Age | Role   | Notes                                      |
|-------|-----|--------|--------------------------------------------|
| Layla | 10  | Kid    | Own login, own avatar, own dashboard       |
| Jack  | 8   | Kid    | Own login, own avatar, own dashboard       |
| Parent(s) | — | Admin | PIN-protected from kid devices          |

Data model should be agnostic to number of kids / parents so it scales later.

---

## 3. Core Concept

- Kids earn **points** for chores, good behavior, and bonuses
- Kids lose points for missed chores, bad behavior, and penalties
- Points can be **redeemed** in the prize store (screen time, YouTube time, physical rewards like the old iPad at 500 pts, outings, etc.)
- Kids also **self-report a daily mood/behavior** via emoji faces
- Parents see individual + combined reports

---

## 4. User Roles & Access

### Parent
- Full CRUD on kids, chores, prizes, activities, points
- Approve/deny kid-submitted chore completions
- Access to reports and charts
- PIN-protected settings panel (so kids can't switch from the wall iPad to parent mode)

### Kid
- Log in as themselves (avatar + simple PIN or tap-to-login on wall iPad)
- See their own points, chores, prizes, badges
- Mark chores as "done" (goes to parent for approval, or auto-approves depending on chore)
- Submit daily mood
- Browse & redeem prizes (redemption may require parent approval)
- Add items to a **wishlist** (see additions)

### Wall Display
- No login / kiosk mode
- Shows today's chores per kid, shared family calendar, points leaderboard, upcoming events, weather if you want
- Tap-to-switch into either kid's detail view, then auto-logout after X minutes

---

## 5. Feature Requirements

### 5.1 Points System
- Configurable base point values per chore / behavior / penalty
- Manual adjustment by parent with a reason note (required) — e.g. "+20 for being helpful at dinner"
- History log of every point change (who, what, when, why)
- Optional: bonus multipliers (streak bonus, weekend double points, etc. — see additions)

### 5.2 Chores
- Create/edit/delete chores
- Fields: name, emoji, point value, assigned kid(s), frequency (one-off, daily, weekly, custom), due time
- Recurring chores auto-generate for the schedule
- Kid marks chore done → optional parent approval → points credited
- Missed chore → optional auto-deduct at end of day (configurable per chore)
- Views:
  - **List view** (today, this week)
  - **Calendar view** (month/week)
  - Per-kid filtering

### 5.3 Behavior Check-in
- Once per day (or twice — morning/evening?), kid selects an emoji face representing their day
- Suggested scale: 😀 🙂 😐 😕 😢 (or with more nuance — 😄 🙂 😐 😤 😭)
- Optional note/journal field (kids can skip)
- Parent sees this in reports; can correlate moods with events
- Parent can also tag the day as "good day" / "rough day" independently and assign point adjustment

### 5.4 Prizes / Rewards Store
- Parent creates prizes with: name, emoji, cost in points, category (screen time / physical item / outing / special privilege), optional limit (once per day, once ever, etc.)
- Kid browses store, taps "Redeem"
- Redemption requires parent approval (prevents accidental spending)
- Once approved, points deducted and prize is logged as "earned — awaiting delivery" then "fulfilled"
- Suggested starter prizes:
  - 15 min YouTube — 20 pts
  - 30 min video games — 40 pts
  - Pick dinner tonight — 75 pts
  - Movie night pick — 100 pts
  - Stay up 30 min late — 150 pts
  - Old iPad — 500 pts
  - (Parent can add unlimited more)

### 5.5 Activities / Calendar
- Parent adds activities for each kid: school events, band practice, flag football, dentist, etc.
- Fields: title, emoji, kid(s), start/end, location, recurring?, notes, reminder
- Shows on kid's dashboard ("Today" + "Upcoming") and wall display
- Integrates into the same calendar as chores (toggle to show chores / activities / both)

### 5.6 Kid Dashboard
- Big points total with a fun counter animation when it changes
- "Today" card: chores remaining + completed, next activity, mood check-in prompt
- Progress bar toward their next saved-up prize (huge motivator — show "67 points to iPad!")
- Badges/streaks summary
- Recent activity feed ("+10 for making bed", "Redeemed 30 min video games")
- Graph of points over the last 30 days (kids love watching lines go up)

### 5.7 Parent Dashboard & Reports
- Combined family view: everyone's totals, today's chore completion %, pending approvals
- Per-kid view: detailed points history, mood history, chore completion rate, prizes redeemed
- Weekly/monthly report: total earned, total spent, top chores, mood trend
- Export to CSV (nice for keeping records)

### 5.8 Wall Display (Kiosk) Mode
- Dedicated URL / route (?mode=wall) with no login
- Auto-refreshes data every ~30 sec
- Shows:
  - Today's date + weather (optional)
  - Each kid's points, today's chores (checkable if tapped — may require PIN)
  - Next 3 family events
  - Rotating "spotlight" — recent achievement, biggest streak, prize someone just earned
- Sleep mode after X mins inactive (dim screen, show just a clock + points)

### 5.9 Point Transfers (Kid-to-Kid)
Kids can gift points to each other — teaches generosity, saving for shared goals, and negotiation. Every transfer goes through parent approval, which is where the app earns its value: the parent sees the situation, decides fairness, and can reward genuine generosity with bonus points.

- **Initiate:** kid taps "Send Points" → selects sibling → enters amount → optional message + emoji (🎁 🎉 💝)
- **Approval:** parent approval is always required — not toggleable. Every transfer lands in the approval queue. Parent sees sender, recipient, amount, message, and recent transfer history between these two kids before deciding.
- **Limits (parent-configurable):**
  - Daily max transfer amount (default: 50 pts)
  - Max transfers per week (default: 3)
  - Minimum balance floor — can't transfer if it drops sender below X (default: 0)
  - Cooldown between transfers (default: 1 hour)
  - Per-kid overrides (e.g., younger sibling capped lower to prevent older-sibling pressure)
- **Anti-collusion safeguards:**
  - **Lockup period:** received points can't be re-transferred for 48 hours. Prevents A→B→A point-washing.
  - **Round-trip detection:** if points flow A→B and then B→A within 7 days, parent dashboard flags the pair.
  - **Net-flow view:** parent can see net point flow between any two kids over time (e.g., "Jack → Layla net +120 pts this month"). Makes imbalance obvious.
  - **Weekly cap:** hard ceiling on total outbound transfers per kid per week, separate from the per-transfer limits.
  - **Pre-penalty protection:** points transferred within 1 hour before a parent-applied penalty are auto-reversible. Prevents "stashing" with a sibling to dodge a deduction.
- **Parent Bonus on approval:** when approving a transfer, parent gets a "Give sender a bonus" field. They can add any amount (0, +10, +25, +50, or custom) with an optional reason. Context-dependent:
  - Genuine generosity? "+25 bonus, you're a great brother."
  - Routine gift? Approve with 0 bonus.
  - Suspicious? Deny the whole thing.
  - This is the feature that turns a neutral transfer mechanism into a values-teaching tool — parents actively reward the behavior they want to see.
- **Transparency:**
  - Dedicated "Transfers" tab in parent reports — full log, filterable by kid, with net-flow chart
  - Both kids see transfers in their point history with clear icons (🎁 received / 💝 sent)
  - Parent bonus shows on the sender's history as a separate line item so the kid sees why they got extra ("+25 bonus for sharing with Layla")
- **Reversibility:** parent can reverse any transfer within 24 hours, no questions asked.
- **Receipt experience:** when a kid logs in and has a new approved gift, it shows as a wrapped-present animation on their dashboard. They tap to "open" it and see sender + message + amount.

### 5.10 Family Management (Add / Edit / Remove Users)
Standard CRUD for everyone in the app — this is the first thing a new parent will use.

- **First-run setup wizard:** on a fresh install, walks the first parent through creating their account, then adding their kids one by one. Can be skipped and completed later from settings.
- **Add a kid:** name, age, birthday (optional, enables birthday badges), avatar, accent color, starting point balance (default 0), 4-digit PIN. Kid appears instantly across all dashboards, approval queue, chore assignment dropdowns, etc.
- **Edit a kid:** update any field anytime. Changing name/avatar doesn't break history — past entries keep their reference via user_id.
- **Remove a kid:** soft-delete by default (archive), with an option to hard-delete after confirmation.
  - **Soft-delete (archive):** kid is hidden from active views but their history is preserved. Reversible with one tap.
  - **Hard-delete:** requires typing the kid's name to confirm. Warns about what will be removed, offers CSV export of their full history first.
  - **Orphan handling:** any chores, activities, or pending approvals assigned to the removed kid are flagged for reassignment or cleanup.
- **Add a parent:** name, email (optional, for weekly summary), password, avatar. Multiple parents supported from day one.
- **Edit a parent:** same flexibility as kids.
- **Remove a parent:** soft or hard delete, but the app always requires at least one active parent account. Last-parent deletion is blocked with a clear message.
- **Permission levels (future-friendly):** schema supports parent + eventually co-parent or helper roles. MVP treats all parents as equal admins.
- **Profile switching:** on a shared device (like the wall iPad), a single tap shows all family members as avatar tiles. Tap an avatar → PIN prompt → logged in as that person.
- **Audit trail:** every add/edit/remove of a user is logged with who did it and when.

---

## 6. Suggested Additions (my picks)

> These are recommendations — cut any you don't want.

### For Kids
- **Avatars** — kid picks an avatar (emoji combo, colors, accessories). Makes it feel like theirs.
- **Badges & achievements** — "7-day chore streak", "First 500 pts earned", "Perfect week", "Helpful helper". Surfaces on dashboard.
- **Streaks** — consecutive days of completing all chores. Visible counter with a flame emoji 🔥. Missing a day resets it. Big motivator.
- **Wishlist** — kid can add prizes they'd like the parent to add to the store. Parent reviews and approves/adjusts cost.
- **Next goal tracker** — kid "pins" a prize and dashboard shows a progress bar toward it. Way more motivating than a raw number.
- **Sound effects + confetti** on point gains, redemptions, and level-ups (toggleable).
- **Levels / ranks** that level up with total lifetime points (separate from spendable balance). E.g. "Apprentice" → "Hero" → "Legend". Doesn't reset when they spend.
- **Kid vs kid leaderboard** — optional, toggleable. Can be motivating OR cause friction between siblings.

### For Parents
- **Quick-tap buttons** on parent mode: "+5 helpful", "+10 good behavior", "-10 attitude", etc. Pre-configured, one tap.
- **Approval queue** — one screen showing all pending chore completions, prize redemptions, and transfers. Swipe right to approve, left to deny.
- **Chore templates** — save common chore setups ("After school routine" = make bed + homework + feed dog, all at once).
- **Auto-deduction rules** — "if chore X isn't done by 8pm, deduct Y points." Optional per chore.
- **Penalty cards** — distinct from negative points. E.g. "No screens tonight". Tracks separately so kid can see why.
- **Bonus events** — schedule a "Double Points Weekend" or "Clean Room Bonus Week" in advance.
- **Parent PIN** — required to switch from kid/wall mode → parent mode. Just 4 digits.
- **Weekly summary notification** — Sunday night email/push: "Here's how the kids did this week".
- **Undo / recent actions** — last 10 changes show with an undo button.
- **Notes per kid per day** — private parent journal.

### Smart/fun mechanics
- **Save up bonus** — if kid holds points for 30+ days without spending, they earn a small interest bonus. Teaches saving.
- **Chore auction** — occasionally post bonus chores with high point values. First kid to claim it gets it.
- **Family goal** — a shared bucket kids can donate points to, unlocking a family reward (movie night, pizza party).
- **Mood → chore difficulty link** — if a kid logs 😢, parent dashboard nudges with "Layla had a rough day — maybe ease up on chores tonight?"

---

## 7. Data Model (rough sketch)

users
  id, name, role (parent|kid), age, birthday, avatar, accent_color, theme_preference (light|dark|auto),
  pin_hash, password_hash, email, archived (bool), archived_at, created_at, created_by

points_ledger
  id, user_id, amount (+/-), reason, source_type (chore|behavior|manual|redemption|bonus|penalty),
  source_id, created_by (parent_id), created_at

chores
  id, name, emoji, point_value, assigned_to (user_id or array), frequency (once|daily|weekly|custom),
  schedule (cron-like or RRULE), due_time, requires_approval, auto_deduct_if_missed, active

chore_instances
  id, chore_id, assigned_to, due_date, status (pending|submitted|approved|denied|missed),
  completed_at, approved_by, notes

prizes
  id, name, emoji, cost, category, limit_type (none|daily|weekly|once_ever), stock, active

redemptions
  id, user_id, prize_id, cost_at_redemption, status (pending|approved|denied|fulfilled),
  requested_at, approved_by, fulfilled_at

activities
  id, title, emoji, assigned_to (user_id or array), start, end, location,
  recurrence (RRULE), reminder_minutes_before, notes

behavior_logs
  id, user_id, date, mood_emoji, note

badges
  id, user_id, badge_key, earned_at

wishlist
  id, user_id, name, notes, status (submitted|approved|denied|added_to_store)

transfers
  id, from_user_id, to_user_id, amount, message, emoji, status (pending|approved|denied|reversed),
  requested_at, approved_by, approved_at, reversed_at, reversed_by,
  parent_bonus_amount, parent_bonus_reason, locked_until

settings
  key, value (JSON) — for global config like double-points weekends

---

## 8. Screen Map

### Parent
- Dashboard (family overview)
- Approval queue
- Per-kid detail (points history, mood, chores, badges)
- Reports (weekly/monthly, exportable)
- Manage → Kids & Parents / Chores / Prizes / Activities / Settings
- Quick-action panel (floating, always accessible)

### Kid
- Login (tap avatar → PIN)
- Home dashboard
- Chores (today / upcoming)
- Prize store
- Wishlist
- Calendar
- Badges / stats
- Mood check-in (modal, once per day)

### Wall
- Home kiosk view (always-on)
- Tap a kid's card → their read-only dashboard → auto-logout after 2 min

---

## 9. Design Direction

- **Modern, soft, playful — not childish.** Layla is 10; she'll reject anything that looks like a preschool app. Think Apple Fitness / Duolingo / Todoist vibes rather than Nick Jr.
- **Light & Dark mode, per user.**
  - Three choices per account: Light, Dark, Auto (follow iOS/system setting)
  - Saved per user so mom can prefer light, Layla can prefer dark, etc.
  - Smooth cross-fade transition when switching (not an abrupt flash)
  - Quick toggle accessible from profile menu, plus a proper control in settings
  - Wall display has its own separate theme setting — usually best left on dark since it's often viewed in low light
  - Both themes must be fully designed using semantic color tokens (background, surface, accent, text-primary, text-muted, success, danger)
  - Kid accent colors work in both modes — saturation tuned differently for light vs dark
- **Rounded corners, generous padding, big tap targets** — this will be thumb-driven.
- **Color palette per kid** — Layla picks her accent color, Jack picks his. Their parts of the app subtly theme to their color.
- **Subtle motion** — points counter rolls up, chore checkbox animates, prize redemption has a small burst. Not cartoonish.
- **Custom font** — a friendly geometric sans (Nunito, Inter, DM Sans).
- **Emoji-first visual language** — since no photos, lean into emoji heavily. Big emoji for chores, prizes, activities.
- **Glassmorphism or soft neumorphism** on cards — gives a premium feel without being a fad.

---

## 10. Tech Stack Options

### Option A — Cloud-hosted (recommended)
- Frontend: React + Vite, deployed to Vercel or Cloudflare Pages
- Backend + DB + Auth: Supabase (handles users, DB, realtime, file storage all in one)
- Accessible from anywhere — phones, iPads, even when kids are at grandma's
- Free tier is plenty for a single family; no hardware to maintain
- Install to home screen as a PWA on each iPhone/iPad — feels like a native app

### Option B — Self-hosted
- Frontend: React + Vite (or vanilla HTML/JS if keeping it lean)
- Backend: Node.js + Express, or Python + FastAPI
- DB: SQLite (plenty for a family) or Postgres
- Auth: simple JWT + PIN for kids, stronger password for parents
- Host: Docker container on a home server, Raspberry Pi, or mini PC

### Option C — Static + localStorage (simplest, but limited)
- Single HTML/JS app, all data in browser localStorage
- Works offline, zero backend
- Downside: data is per-device with no sync between devices
- Only viable if the family will use exactly one shared device

**Recommendation: Option A (Supabase + Vercel).** Fast to build, handles multi-device sync out of the box, free, and zero hardware maintenance.

---

## 11. PWA / iOS Considerations

- Add to Home Screen from Safari → full-screen app experience
- Configure apple-touch-icon, theme color, and a splash screen
- display: standalone in manifest
- Service worker for offline-ish support (wall iPad should survive a router reboot)
- Disable double-tap-zoom and bounce scroll in kiosk CSS for the wall iPad

---

## 12. Phased Roadmap

### Phase 1 — MVP (core loop works)
- First-run setup wizard
- Family management: add / edit / archive / remove kids & parents
- Chores CRUD + list view
- Points ledger + manual adjustments
- Prize store + redemptions (with approval)
- Kid dashboard + Parent dashboard
- Basic auth (avatar + PIN for kids, password for parents)

### Phase 2 — Quality of life
- Calendar view for chores + activities
- Recurring chores / auto-generation
- Daily mood check-in
- Approval queue
- Quick-action buttons for parent
- Wall display mode

### Phase 3 — Delight & engagement
- Badges, streaks, levels
- Progress bar toward pinned prize
- Sound effects + animations
- Graphs/charts on dashboards
- Wishlist

### Phase 4 — Advanced
- Family goals / shared bucket
- Chore auctions
- Penalty cards
- Point transfers between kids (with all the guardrails)
- Weekly email summary
- CSV export

---

## 13. Open Questions (worth deciding before build)

1. **Chore approval:** every chore requires parent approval, or some auto-approve (quick stuff like "made bed") and others require approval (big stuff like "cleaned room")?
2. **Login friction for kids:** PIN every time, or persistent login on their own devices + PIN on wall iPad?
3. **Negative balance allowed?** Can points go below zero, or is zero the floor?
4. **Shared chores:** chores both kids can claim (first-come-first-served), or only individually assigned?
5. **One parent account or two?** Separate logins or shared?
6. **Mood check-in:** once a day, twice, or optional-anytime?
7. **Leaderboard between kids:** on or off?
8. **Redemption flow for screen time:** does the app enforce it (timer), or just log it and parent enforces manually?
9. **Point transfers:** on at launch, or add in Phase 4?
10. **Transfer age gate:** should the younger sibling have a lower daily/weekly transfer limit?
11. **Parent bonus defaults:** quick-tap preset amounts (+10, +25, +50) or just a freeform number field?

---

## 14. Naming Ideas

- **Kudos** — simple, clean, sounds like a real product
- **Pointly** — cute, app-y
- **Tally** — minimalist
- **Cloud Nine** — points = getting to the clouds
- **Quest** — leans into the game/adventure angle
- **The Board** — nods to the physical chore chart

---

*End of blueprint. Iterate from here — this is a living doc.*
