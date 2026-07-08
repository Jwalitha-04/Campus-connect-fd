-- Skills table
create table if not exists public.skills (
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
create table if not exists public.swap_matches (
  id uuid default gen_random_uuid() primary key,
  user_a_id uuid references public.profiles(id) on delete cascade not null,
  user_b_id uuid references public.profiles(id) on delete cascade not null,
  skill_offered_by_a uuid references public.skills(id) on delete set null,
  skill_offered_by_b uuid references public.skills(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions table
create table if not exists public.sessions (
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
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.swap_matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  content text not null,
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ratings table
create table if not exists public.ratings (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 5),
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.skills enable row level security;
alter table public.swap_matches enable row level security;
alter table public.sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ratings enable row level security;

-- Drop existing policies if they exist to avoid conflict
drop policy if exists "Skills are viewable by everyone" on public.skills;
drop policy if exists "Users can manage their own skills" on public.skills;
drop policy if exists "Swap matches are viewable by participants" on public.swap_matches;
drop policy if exists "Users can manage their own swap matches" on public.swap_matches;
drop policy if exists "Sessions are viewable by match participants" on public.sessions;
drop policy if exists "Match participants can manage sessions" on public.sessions;
drop policy if exists "Chat messages are viewable by match participants" on public.chat_messages;
drop policy if exists "Match participants can insert chat messages" on public.chat_messages;
drop policy if exists "Ratings are viewable by everyone" on public.ratings;
drop policy if exists "Reviewers can manage their ratings" on public.ratings;

-- Policies for skills
create policy "Skills are viewable by everyone" on public.skills
  for select using (true);
create policy "Users can manage their own skills" on public.skills
  for all using (auth.uid() = user_id);

-- Policies for swap_matches
create policy "Swap matches are viewable by participants" on public.swap_matches
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Users can manage their own swap matches" on public.swap_matches
  for all using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Policies for sessions
create policy "Sessions are viewable by match participants" on public.sessions
  for select using (
    exists (
      select 1 from public.swap_matches m 
      where m.id = match_id and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );
create policy "Match participants can manage sessions" on public.sessions
  for all using (
    exists (
      select 1 from public.swap_matches m 
      where m.id = match_id and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- Policies for chat_messages
create policy "Chat messages are viewable by match participants" on public.chat_messages
  for select using (
    exists (
      select 1 from public.swap_matches m 
      where m.id = match_id and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );
create policy "Match participants can insert chat messages" on public.chat_messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.swap_matches m 
      where m.id = match_id and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- Policies for ratings
create policy "Ratings are viewable by everyone" on public.ratings
  for select using (true);
create policy "Reviewers can manage their ratings" on public.ratings
  for all using (reviewer_id = auth.uid());

-- Triggers for Session Completion
create or replace function public.handle_session_completion()
returns trigger as $$
declare
  match_row record;
begin
  if new.status = 'completed' and old.status != 'completed' then
    -- Retrieve match details
    select user_a_id, user_b_id into match_row
    from public.swap_matches
    where id = new.match_id;

    -- Award +15 reputation points to both users
    update public.profiles
    set reputation_points = reputation_points + 15
    where id in (match_row.user_a_id, match_row.user_b_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_session_completed on public.sessions;
create trigger on_session_completed
  after update on public.sessions
  for each row execute procedure public.handle_session_completion();

-- Triggers for Ratings / Tutor Upgrade
create or replace function public.handle_new_rating()
returns trigger as $$
declare
  avg_rating numeric;
  completed_sessions_count integer;
begin
  -- Award +10 points to tutor if 5-star review is left
  if new.score = 5 then
    update public.profiles
    set reputation_points = reputation_points + 10
    where id = new.reviewee_id;
  end if;

  -- Calculate tutor stats
  select coalesce(avg(score), 0), count(distinct session_id) into avg_rating, completed_sessions_count
  from public.ratings
  where reviewee_id = new.reviewee_id;

  -- Upgrade role to 'teacher' (Verified Tutor) if tutor has >= 5 completed sessions with rating >= 4.5
  if completed_sessions_count >= 5 and avg_rating >= 4.5 then
    update public.profiles
    set role = 'teacher'
    where id = new.reviewee_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_rating_added on public.ratings;
create trigger on_rating_added
  after insert on public.ratings
  for each row execute procedure public.handle_new_rating();

-- Create public storage bucket named 'swap-attachments'
insert into storage.buckets (id, name, public)
values ('swap-attachments', 'swap-attachments', true)
on conflict (id) do nothing;

-- Storage object policies for swap-attachments bucket
drop policy if exists "Swap attachments are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload swap attachments" on storage.objects;
drop policy if exists "Authenticated users can update their own swap attachments" on storage.objects;
drop policy if exists "Authenticated users can delete their own swap attachments" on storage.objects;

create policy "Swap attachments are publicly accessible" on storage.objects
  for select using (bucket_id = 'swap-attachments');

create policy "Authenticated users can upload swap attachments" on storage.objects
  for insert with check (
    bucket_id = 'swap-attachments' 
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can update their own swap attachments" on storage.objects
  for update using (
    bucket_id = 'swap-attachments' 
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can delete their own swap attachments" on storage.objects
  for delete using (
    bucket_id = 'swap-attachments' 
    and auth.role() = 'authenticated'
  );

-- Enable Supabase Realtime for chat messages
alter publication supabase_realtime add table public.chat_messages;
