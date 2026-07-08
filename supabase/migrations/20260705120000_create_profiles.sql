-- Create public profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  bio text,
  department text not null,
  graduation_year integer,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  reputation_points integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Profiles are publicly readable." on public.profiles
  for select using (true);

create policy "Users can edit their own profiles." on public.profiles
  for update using (auth.uid() = id);

-- Trigger to copy user credentials from auth.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, department, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Campus Member'),
    coalesce(new.raw_user_meta_data->>'department', 'Undeclared'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Remove the trigger if it already exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
