# Campus Connect — PRD Module: Skill Swap

## 1. Module Overview
The Skill Swap module allows students and teachers to trade knowledge in a barter-style peer-to-peer ecosystem. Users list skills they can teach ("Offering") and skills they want to learn ("Wanting"), and the system matches users with complementary needs. It includes session scheduling, real-time messaging, and review-based feedback.

---

## 2. Database Schema (Target Design)

### Table: `skills`
```sql
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  category text not null, -- e.g., 'programming', 'languages', 'music', 'design', 'academics', 'other'
  type text not null check (type in ('offering', 'wanting')),
  proficiency_level text not null check (proficiency_level in ('beginner', 'intermediate', 'advanced')),
  availability text not null, -- e.g., 'Weekends', 'Evenings after 5 PM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.skills enable row level security;
create policy "Skills viewable by all authenticated users." on public.skills for select using (true);
create policy "Authenticated users can create skill listings." on public.skills for insert with check (auth.uid() = user_id);
create policy "Users can modify their own skill listings." on public.skills for update using (auth.uid() = user_id);
```

### Table: `swap_matches`
```sql
create table public.swap_matches (
  id uuid default gen_random_uuid() primary key,
  user_a_id uuid references public.profiles(id) on delete cascade not null,
  user_b_id uuid references public.profiles(id) on delete cascade not null,
  skill_offered_by_a uuid references public.skills(id) on delete set null,
  skill_offered_by_b uuid references public.skills(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.swap_matches enable row level security;
create policy "Participants can view matches." on public.swap_matches 
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);
```

### Table: `sessions`
```sql
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.swap_matches(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete set null not null,
  session_date date not null,
  session_time time without time zone not null,
  location_type text not null check (location_type in ('online', 'physical')),
  location_detail text not null, -- meeting link or physical room number
  status text not null default 'requested' check (status in ('requested', 'accepted', 'rescheduled', 'cancelled', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sessions enable row level security;
```

### Table: `chat_messages`
```sql
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.swap_matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  content text not null,
  attachment_url text, -- for sharing homework / files
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_messages enable row level security;
```

### Table: `ratings`
```sql
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 5),
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ratings enable row level security;
```

---

## 3. Detailed Feature Specifications

### A. Skill Posting Workflow
*   **Target URL:** `/skill-swap/post`
*   **Fields:**
    *   Skill Name (e.g. "ReactJS Development")
    *   Description (What you can teach or what you want to learn)
    *   Category (Dropdown: Programming, Language, Academic, Design, Music, etc.)
    *   Type (Radio: "Offering" / "Wanting")
    *   Proficiency Level (Radio: Beginner, Intermediate, Advanced)
    *   Availability (Text input, e.g. "Mon/Wed after 6 PM")

### B. Barter-Based Matching Engine
*   **Mechanism:**
    *   When User A lists: `Offering: Skill X` and `Wanting: Skill Y`.
    *   The system searches the `skills` table for a User B who has: `Offering: Skill Y` and `Wanting: Skill X`.
    *   Upon finding a match, the system creates a record in `swap_matches` with status `pending`.
    *   **Notification:** Both users receive a notification: *"We found a swap match! User B wants to learn [Skill X] and can teach you [Skill Y]!"*
    *   **Visual Element:** On the UI, this match displays Card A and Card B tied together by the Red String SVG connector.

### C. Session Scheduler Workflow
Users negotiate and coordinate sessions within their match portal:
1.  **Request Session:** Either user fills a form (Date, Time, Location Type: Online/Physical, Location Detail/Link). Status becomes `requested`.
2.  **Respond to Request:** The recipient can:
    *   *Accept:* Status becomes `accepted`. Triggers automated email calendar invite.
    *   *Reschedule:* Modifies Date/Time, flips requester ID, status becomes `rescheduled` (waiting for other's acceptance).
    *   *Cancel:* Status becomes `cancelled`.
3.  **Completion:** After the meeting time passes, both users can mark the session as `completed`. Once marked complete by both, the `swap_matches` status switches to `completed` and unlocks the review form.

### D. Chat System
*   **Path:** `/skill-swap/match/[match_id]/chat`
*   **Supabase Realtime integration:**
    *   Subscribe to changes on `chat_messages` filtered by `match_id`.
    *   Messages appear in real-time without polling.
*   **File Sharing:** Users can attach files (homework sheets, code files, PDFs) up to 10MB, uploaded to Supabase Storage Bucket `swap-attachments/`.

### E. Ratings & Feedback Loops
*   Once a session is marked `completed`, a rating card is pinned to each participant's sidebar.
*   Users review their partner out of 5 stars and leave optional written feedback.
*   **Calculated Reputation:**
    *   Completing a session adds 15 Reputation Points to both users.
    *   Receiving a 5-star review adds an extra 10 Reputation Points to the teacher's profile.
    *   Cumulative tutor score is displayed as a badge: **Verified Tutor** (unlocked after 5 sessions with average rating > 4.5).
