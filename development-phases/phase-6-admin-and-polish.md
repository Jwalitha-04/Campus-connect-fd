# Development Roadmap — Phase 6: Admin Dashboard & Skeuomorphic Polish

This phase implements the moderation reports database, admin metrics views, sound sprite systems, time-of-day ambient themes, and accessibility safety settings.

---

## 1. Objectives & Deliverables
*   Create the database schema for the `moderation_reports` table with Admin RLS policies.
*   Build the Admin Analytics dashboard view and moderation panels.
*   Implement webcam-based QR Code scanning overrides.
*   Build the skeuomorphic Audio Engine system.
*   Configure the optional Time-of-day theme triggers.
*   Implement motion restrictions and production builds testing.

---

## 2. Step-by-Step Task List

### Task 6.1: Moderation Reports Schema Setup
Execute this SQL migration in your Supabase SQL Editor:
```sql
-- Create moderation_reports table
create table public.moderation_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('post', 'comment', 'skill', 'item')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.moderation_reports enable row level security;

-- Policies
create policy "Admins have full control." on public.moderation_reports
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );
```

### Task 6.2: Build the Admin Metrics & Moderation UI
*   Create the admin layout at `/admin/layout.tsx` (restricts entry to users where `profiles.role = 'admin'`).
*   Create `/admin/dashboard`:
    *   Render widgets: Total users count, active listings, returned items rates, top tutor lists.
    *   Charts are customized to look like hand-drawn marker sketches (using Recharts or ChartJS parameters, e.g. sketch-style strokes).
*   Create `/admin/moderation`:
    *   Displays list of flagged items.
    *   Provide Action triggers:
        *   *Dismiss:* Sets status to `dismissed`.
        *   *Remove Content:* Calls server action deletion trigger.

### Task 6.3: Implement webcam QR scanner overrides
*   Create admin page at `/admin/qr-desk`.
*   Integrate library `html5-qrcode`.
*   Initialize webcam scanner overlay.
*   When a claim QR code payload is scanned (contains `/lost-found/verify/${item_id}`):
    1.  Validates active session and role.
    2.  Pulls the claimant claim row record.
    3.  Allows Admin to override hand-off in one click (marks claim `approved` and item `returned`).

### Task 6.4: Build the Skeuomorphic Audio Engine
*   Bundle a single audio sprite file `corkboard-sounds.mp3` containing sound files (Thock, Paper Rustle, Perforation Tear, String Pluck, Stamp Thud) inside `public/sounds/`.
*   Create client utility `src/utils/audio.ts` utilizing Web Audio API:
    *   Reads and checks if `soundEnabled = true` from localStorage settings.
    *   Pre-buffers sprite sheet and provides triggers playing specific time offsets (e.g. `playSprite('tear')`).
*   Bind sounds:
    *   Adding card $\to$ Thock (cork).
    *   Hovering card $\to$ Paper rustle.
    *   Tearing ticket $\to$ Perforation tear.
    *   Stamp confirmation $\to$ Stamp thud.

### Task 6.5: Configure Time-of-Day Ambient Shadows
*   Implement layout utility overlay checking the client's current hour:
    *   *Morning (6 AM - 11 AM):* Add light blue overlay filter, lengthen pin shadows at an angle (`shadow-[8px_14px_20px_rgba(40,30,20,0.12)]`).
    *   *Midday (11 AM - 4 PM):* Standard bright cork, short shadows (`shadow-[2px_4px_8px_rgba(40,30,20,0.18)]`).
    *   *Evening (4 PM - 7 PM):* Warm amber overlay tint, shadow length increased.
    *   *Night (7 PM - 6 AM):* Dark theme override (cork-bg-darker, glowing string filters).

### Task 6.6: Motion Safety Controls & Production Audit
*   Wrap critical animations inside Tailwind CSS `@media (prefers-reduced-motion: reduce)` override settings:
    *   `.motion-reduce\:animate-none` disables card idle flutters and pin wiggles for users who have motion restrictions toggled in OS.
*   Run production checks:
    *   Audit build stability (`npm run build`).
    *   Confirm all custom fonts are preloaded correctly and do not block layout rendering.
*   Deploy workspace project to Vercel.

---

## 3. UI/UX Elements to Implement
*   **Crumpled paper textures:** Banned or moderation listings are formatted with CSS distressed noise filters.
*   **Drawn Analytics Plots:** Charts use irregular board boundary lines.

---

## 4. Verification & Testing Checklist
1.  **Admin Protection Check:** Attempt loading path `/admin` with a Student account check to verify that redirection to `/` works correctly.
2.  **QR Override Hand-off:** Scan a test claim QR code via webcam scanning. Confirm execution updates database rows properly.
3.  **Mute Default Gate:** Confirm all sound events default to silent on first-time login sessions until explicit consent is given.
4.  **Motion Preference Test:** Change your operating system settings to "Reduce Motion" and confirm card hover wiggles and pin sticks scale transitions disable immediately.
