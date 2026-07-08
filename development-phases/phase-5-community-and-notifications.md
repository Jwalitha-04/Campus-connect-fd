# Development Roadmap — Phase 5: Community Features & Notification Engine

This phase builds the Community discussion board, nested comment threads, resource attachments, custom post reactions, real-time in-app notifications, and Resend transactional email templates.

---

## 1. Objectives & Deliverables
*   Execute database migrations for `posts`, `comments`, and `post_reactions`.
*   Build the Community Board listing feed with filter tags.
*   Implement details view supporting recursive comments (2 levels deep) and Accepted Answer pins for Q&A.
*   Configure custom reactions (Heart, Pin, Check) that apply skeuomorphic visual overlays on cards.
*   Build a global real-time notification listener component (hanging sticky note layout).
*   Integrate Resend email transporter with Next.js API Routes.

---

## 2. Step-by-Step Task List

### Task 5.1: Database Schemas Migration
Execute this SQL migration in your Supabase SQL Editor:
```sql
-- Posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text not null check (category in ('discussion', 'announcement', 'event', 'resource', 'club_update', 'qa')),
  attachments text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  is_accepted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Post Reactions table
create table public.post_reactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('heart', 'pin', 'check')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, post_id, reaction_type)
);

-- Enable RLS
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;

-- Set up policies:
-- Anyone can view posts, comments, reactions.
-- Authenticated users can insert.
-- Owners can edit.
```

### Task 5.2: Build the Community Board Listing Feed
*   Create feed page at `/community`.
*   Implement layout:
    *   Horizontal categories slider at the top (Discussion, Q&A, Resource Sharing, Announcements, Events).
    *   Staggered masonry card layout.
    *   Special visual formatting:
        *   *Announcements:* Thick red border, styled with a distinct brass pin.
        *   *Q&A:* Question mark drawing overlay.
        *   *Resource Sharing:* Clip icon overlaying attachment counts.

### Task 5.3: Build Detail Thread & Nested Comments
*   Create routing at `/community/post/[id]`.
*   Implement recursive comment lists:
    *   Limit nesting depth to 2 levels.
    *   Provide simple "Reply" toggle form inline.
*   **Q&A Solved Action:**
    *   If post category is `qa` and active user is the author:
        *   Display "Accept Answer" check stamp next to replies.
        *   Clicking calls Server Action setting `comments.is_accepted = true`.
        *   Accepted comment sticks to the top of the comment feed, styled with a green highlighter background overlay and a handwritten "SOLVED" stamp.

### Task 5.4: Implement Custom Post Reactions
*   Add inline reaction buttons to cards: Heart, Pin, Check.
*   On Click:
    1.  Inserts/deletes entry in `post_reactions` table.
    2.  Flashes skeuomorphic overlay (e.g. Heart draws a scribbled heart outline around the post; Pin inserts a small silver pin graphic).

### Task 5.5: Build the Global In-App Notifications Listener
*   Create a React listener component `src/components/shared/NotificationListener.tsx` mounted inside the root app layout.
*   Opens a Supabase Realtime channel listening to inserts inside a new `public.notifications` database table.
*   Upon receipt:
    *   Renders a hanging warning tag (mini yellow sticky note) that animates sliding down from the top right header (`animate-pin-stick`).

### Task 5.6: Setup Transactional Email Transport
*   Install Resend client package: `npm install resend`
*   Create API handler `src/app/api/email/send/route.ts`.
*   Draft templates:
    *   *Match alert:* Send details of matching item reports with direct check links.
    *   *Upcoming session reminder:* Scheduled email containing meeting links and ICS details.
