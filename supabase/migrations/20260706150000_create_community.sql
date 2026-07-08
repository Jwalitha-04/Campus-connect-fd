-- Posts table
create table if not exists public.posts (
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
create table if not exists public.comments (
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
create table if not exists public.post_reactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('heart', 'pin', 'check')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, post_id, reaction_type)
);

-- Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null,
  link text,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.notifications enable row level security;

-- Drop existing policies if they exist to avoid conflict
drop policy if exists "Posts are viewable by everyone" on public.posts;
drop policy if exists "Users can manage their own posts" on public.posts;
drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Users can manage their own comments" on public.comments;
drop policy if exists "Post reactions are viewable by everyone" on public.post_reactions;
drop policy if exists "Authenticated users can insert reactions" on public.post_reactions;
drop policy if exists "Users can delete their own reactions" on public.post_reactions;
drop policy if exists "Notifications are viewable by recipient" on public.notifications;
drop policy if exists "System can insert notifications" on public.notifications;
drop policy if exists "Recipient can update notifications" on public.notifications;

-- Policies for posts
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);
create policy "Users can manage their own posts" on public.posts
  for all using (auth.uid() = user_id);

-- Policies for comments
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);
create policy "Users can manage their own comments" on public.comments
  for all using (auth.uid() = user_id);

-- Policies for post_reactions
create policy "Post reactions are viewable by everyone" on public.post_reactions
  for select using (true);
create policy "Authenticated users can insert reactions" on public.post_reactions
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own reactions" on public.post_reactions
  for delete using (auth.uid() = user_id);

-- Policies for notifications
create policy "Notifications are viewable by recipient" on public.notifications
  for select using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications
  for insert with check (true);
create policy "Recipient can update notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Enable Supabase Realtime for notifications
alter publication supabase_realtime add table public.notifications;
