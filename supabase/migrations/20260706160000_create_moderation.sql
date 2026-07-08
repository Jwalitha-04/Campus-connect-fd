-- Create moderation_reports table
create table if not exists public.moderation_reports (
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

-- Drop existing policy if it exists to avoid conflict
drop policy if exists "Admins have full control." on public.moderation_reports;

-- Policy allowing admins full control
create policy "Admins have full control." on public.moderation_reports
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );
