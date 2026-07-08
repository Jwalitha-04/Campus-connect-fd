-- Create lost_found_items table
create table if not exists public.lost_found_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  description text not null,
  category text not null check (category in ('electronics', 'books', 'documents', 'clothing', 'keys', 'other')),
  images text[] default '{}'::text[],
  date_lost_found date not null,
  time_lost_found time without time zone,
  location text not null check (location in ('Library', 'Cafeteria', 'Hostel', 'Auditorium', 'Parking Area', 'Academic Blocks', 'Sports Complex')),
  contact_info text not null,
  status text not null default 'active' check (status in ('active', 'returned')),
  verification_question text,
  qr_code_data text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.lost_found_items enable row level security;

-- Drop existing policies if they exist to avoid conflict
drop policy if exists "Everyone can view active items." on public.lost_found_items;
drop policy if exists "Authenticated users can create items." on public.lost_found_items;
drop policy if exists "Owners can update their own items." on public.lost_found_items;

-- Policies
create policy "Everyone can view active items." on public.lost_found_items
  for select using (true);

create policy "Authenticated users can create items." on public.lost_found_items
  for insert with check (auth.uid() = user_id);

create policy "Owners can update their own items." on public.lost_found_items
  for update using (auth.uid() = user_id);

-- Insert public storage bucket named 'lost-found-images'
insert into storage.buckets (id, name, public)
values ('lost-found-images', 'lost-found-images', true)
on conflict (id) do nothing;

-- Storage object policies for lost-found-images bucket
drop policy if exists "Lost-Found images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload lost-found images" on storage.objects;
drop policy if exists "Authenticated users can update their own lost-found images" on storage.objects;
drop policy if exists "Authenticated users can delete their own lost-found images" on storage.objects;

create policy "Lost-Found images are publicly accessible" on storage.objects
  for select using (bucket_id = 'lost-found-images');

create policy "Authenticated users can upload lost-found images" on storage.objects
  for insert with check (
    bucket_id = 'lost-found-images' 
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can update their own lost-found images" on storage.objects
  for update using (
    bucket_id = 'lost-found-images' 
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can delete their own lost-found-images" on storage.objects
  for delete using (
    bucket_id = 'lost-found-images' 
    and auth.role() = 'authenticated'
  );
