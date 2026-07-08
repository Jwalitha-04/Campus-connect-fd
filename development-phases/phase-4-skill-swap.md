# Development Roadmap — Phase 4: Skill Swap Module

This phase implements skill listings, barter matchmaking engine, session scheduler calendar integration, real-time messaging, and review-based tutor reputation feedback.

---

## 1. Objectives & Deliverables
*   Execute database migrations for `skills`, `swap_matches`, `sessions`, `chat_messages`, and `ratings`.
*   Build the Skill Swap board interface supporting Offers and Wants tabs.
*   Implement the barter matching suggestions engine.
*   Build the Session Coordinator dashboard with date inputs and rescheduling states.
*   Implement real-time match chat rooms with Supabase Realtime subscriptions.
*   Build tutor/student feedback surveys and reputation calculations.

---

## 2. Step-by-Step Task List

### Task 4.1: Database Schemas & Storage Migration
Execute this SQL migration in your Supabase SQL Editor:
```sql
-- Skills table
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  category text not null,
  type text not null check (type in ('offering', 'wanting')),
  proficiency_level text not null check (proficiency_level in ('beginner', 'intermediate', 'advanced')),
  availability text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Swap Matches table
create table public.swap_matches (
  id uuid default gen_random_uuid() primary key,
  user_a_id uuid references public.profiles(id) on delete cascade not null,
  user_b_id uuid references public.profiles(id) on delete cascade not null,
  skill_offered_by_a uuid references public.skills(id) on delete set null,
  skill_offered_by_b uuid references public.skills(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.swap_matches(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete set null not null,
  session_date date not null,
  session_time time without time zone not null,
  location_type text not null check (location_type in ('online', 'physical')),
  location_detail text not null,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'rescheduled', 'cancelled', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat messages table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.swap_matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  content text not null,
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ratings table
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 5),
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.skills enable row level security;
alter table public.swap_matches enable row level security;
alter table public.sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ratings enable row level security;

-- Setup appropriate select/insert/update policies for each table
```

### Task 4.2: Build the Swap Board Interface
*   Create listings page at `/skill-swap`.
*   Implement layout:
    *   Toggle tabs: "Skills Offered" vs "Skills Wanted".
    *   Category selectors (Academic, Programming, Design, Music, etc.).
    *   Cards styled with a colored push-pin (`--pin-blue` as accent) and subtle handwriting font tags for proficiency level.
*   **Matches Suggestions tab:**
    *   Query `skills` to find direct swaps: User A offers X/wants Y, User B offers Y/wants X.
    *   Display complementary pairings side-by-side linked by a blue push-pin indicator.

### Task 4.3: Implement the Meeting Scheduler
*   Create match details dynamic view at `/skill-swap/match/[id]`.
*   Build Scheduler form module:
    *   Select Date, Time, Location type (Online vs Physical), and Link/Room.
    *   *Rescheduling Flow:* Allows updating meeting parameters, which shifts status to `rescheduled` and prompts partner to "Confirm Changes".
    *   *Acceptance Action:* Updates status to `accepted` and triggers server API sending calendar ICS files in transactional notifications.
    *   *Completion Check:* Trigger button to mark session as `completed` after date/time passes.

### Task 4.4: Build the Real-Time Chat System
*   On the match portal view `/skill-swap/match/[id]`, embed the chat room:
    *   Use Supabase Realtime channel to subscribe to inserts on `chat_messages` where `match_id = active_id`.
    *   Render message list matching standard chat interfaces but styled as handwritten margin notes.
*   **File attachments uploader:**
    *   Configures files upload (homework files, scripts, max 10MB) to Supabase Storage Bucket `swap-attachments`.
    *   Renders attachments as small paper-clip assets that download on click.

### Task 4.5: Ratings & Tutor Reputation Logic
*   Trigger a review overlay modal when session status switches to `completed` for both users.
*   Form: rating slider (1-5 stars) and comment text area.
*   **Database Triggers/Actions for Reputation points:**
    *   Marking session completed adds +15 points to both profiles.
    *   Leaving a 5-star review adds +10 points to the reviewee profile.
    *   If a user completes 5 tutoring sessions with a cumulative score average above 4.5, trigger update in `profiles.role` or profile metadata to show the **Verified Tutor** badge.

---

## 3. UI/UX Elements to Implement
*   **Blue Pushpins:** Render blue pushpin SVG for skill exchange cards.
*   **Paperclip Attachments:** Chat uploads styled as stapled index card sheets.
*   **Star Ratings:** Hand-drawn outline star SVGs that fill with gold highlight overlay on hover selection.

---

## 4. Verification & Testing Checklist
1.  **Direct Matching Engine:** Insert dummy listing matching another user's inverse preferences. Verify the match is suggested in the "Suggested Swaps" list.
2.  **Real-Time Message Sync:** Open two separate browser tabs with different accounts inside the same match portal chat room. Verify messages append instantly without reload.
3.  **Calendar Invite Creation:** Schedule and accept a session checking that a mock email trigger succeeds with active `.ics` file parameters.
4.  **Tutor Badge Activation:** Submit five consecutive 5-star reviews on tutor mock sessions and verify the "Verified Tutor" badge appears on their profile page.
