# Campus Connect — PRD Module: Community

## 1. Module Overview
The Community module serves as the digital notice board for announcements, Q&A, club updates, resource sharing, and events. Users can post, comment, nested reply, filter by categories, attach academic resources, and interact using tactile elements.

---

## 2. Database Schema (Target Design)

### Table: `posts`
```sql
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text not null check (category in ('discussion', 'announcement', 'event', 'resource', 'club_update', 'qa')),
  attachments text[] default '{}'::text[], -- PDF, images, docs uploaded to Supabase storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;
create policy "Everyone can select posts." on public.posts for select using (true);
create policy "Authenticated users can create posts." on public.posts for insert with check (auth.uid() = user_id);
create policy "Authors can edit their own posts." on public.posts for update using (auth.uid() = user_id);
create policy "Authors and Admins can delete posts." on public.posts for delete 
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');
```

### Table: `comments`
```sql
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade, -- Enables nested threads
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;
create policy "Everyone can view comments." on public.comments for select using (true);
create policy "Authenticated users can comment." on public.comments for insert with check (auth.uid() = user_id);
create policy "Authors can edit comments." on public.comments for update using (auth.uid() = user_id);
```

### Table: `post_reactions`
Tracks custom reactions (e.g. standard likes or pins) on posts.
```sql
create table public.post_reactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('heart', 'pin', 'check')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, post_id, reaction_type)
);

alter table public.post_reactions enable row level security;
create policy "Everyone can view reactions." on public.post_reactions for select using (true);
create policy "Authenticated users can react." on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own reactions." on public.post_reactions for delete using (auth.uid() = user_id);
```

---

## 3. Detailed Feature Specifications

### A. Post Categories
1.  **Discussions:** General open-ended campus topics.
2.  **Announcements:** Restricted posting. Only admins or verified student coordinators can post announcements.
3.  **Events:** Requires Event Date/Time and Location coordinates (e.g., Auditorium).
4.  **Resource Sharing:** Specifically tailored for academic sharing (e.g., PDF worksheets, syllabus files). Displays a large download button.
5.  **Club Updates:** Tagged to a specific verified campus club profile.
6.  **Q&A:** Allows marking a specific comment/answer as the "Accepted Answer" by the post author. The accepted answer is highlighted at the top of the comment feed.

### B. Posting Workflow
*   **Target URL:** `/community/new`
*   **Form:**
    *   Title (input, required, max 100 chars)
    *   Category (select, required)
    *   Content (Rich text or Markdown area, required)
    *   Attachments (File upload to Supabase Storage Bucket `community-assets/`, max 15MB. Accepts PDFs, PNGs, ZIPs).
*   **UI Animation:** Card is "pinned" to the board with a visual push-pin stick effect on successful submit.

### C. Discussion and Comment Threads
*   Supports recursive comments (up to 2 levels deep for readability).
*   **Realtime Updates:** Comments append dynamically using Supabase Realtime subscription on `comments` table.
*   **Moderation Hooks:** Flag buttons allow users to report inappropriate content. Reports are logged in a moderation queue for Admins.

### D. Tactile Interaction Details (Visual Theme Alignment)
*   **Reactions:** Instead of a generic "Like" button, users click:
    *   *Heart:* Draw a faint marker heart around the card.
    *   *Pin:* Add a mini decorative pin next to the card's main pin.
    *   *Check:* Marker checkmark indicating verified read.
*   **Resource attachments:** Rendered on the card as a miniature folder clip or stapled packet icon. Hovering shows a preview.
*   **Q&A Solved State:** A bright green highlighter streak across the accepted answer comment body, complete with a handwritten "SOLVED" stamp.
