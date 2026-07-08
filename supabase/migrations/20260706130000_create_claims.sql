-- Create claims table
create table if not exists public.claims (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.lost_found_items(id) on delete cascade not null,
  claimant_id uuid references public.profiles(id) on delete cascade not null,
  answer text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.claims enable row level security;

-- Drop existing policies if they exist to avoid conflict
drop policy if exists "Claimants and Finders can view their claims." on public.claims;
drop policy if exists "Authenticated users can submit a claim." on public.claims;
drop policy if exists "Only Finders can update claim status." on public.claims;

-- Policies
create policy "Claimants and Finders can view their claims." on public.claims
  for select using (
    auth.uid() = claimant_id or 
    auth.uid() = (select user_id from public.lost_found_items where id = item_id)
  );

create policy "Authenticated users can submit a claim." on public.claims
  for insert with check (auth.uid() = claimant_id);

create policy "Only Finders can update claim status." on public.claims
  for update using (
    auth.uid() = (select user_id from public.lost_found_items where id = item_id)
  );

-- Database trigger to increase Reputation Points when a claim is approved
create or replace function public.handle_claim_approval()
returns trigger as $$
declare
  item_owner_id uuid;
begin
  if new.status = 'approved' and old.status != 'approved' then
    -- Find the owner of the item
    select user_id into item_owner_id 
    from public.lost_found_items 
    where id = new.item_id;

    -- Increment the owner's reputation points by 20
    update public.profiles 
    set reputation_points = reputation_points + 20
    where id = item_owner_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Remove trigger if it already exists and recreate
drop trigger if exists on_claim_approved on public.claims;
create trigger on_claim_approved
  after update on public.claims
  for each row execute procedure public.handle_claim_approval();
