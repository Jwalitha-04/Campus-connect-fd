-- Create archived_lost_found_items table
create table if not exists public.archived_lost_found_items (
  id uuid primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  description text not null,
  category text not null,
  images text[] default '{}'::text[],
  date_lost_found date not null,
  time_lost_found time without time zone,
  location text not null,
  contact_info text not null,
  status text not null,
  verification_question text,
  qr_code_data text,
  color text,
  brand text,
  item_type text,
  drop_off_location text,
  warning_sent boolean default false not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on archived table
alter table public.archived_lost_found_items enable row level security;

-- Drop policies if exist
drop policy if exists "Everyone can view archived items" on public.archived_lost_found_items;
drop policy if exists "System can insert/delete archived items" on public.archived_lost_found_items;

-- Recreate policies
create policy "Everyone can view archived items" on public.archived_lost_found_items for select using (true);
create policy "System can insert/delete archived items" on public.archived_lost_found_items for all using (true);

-- Add columns to lost_found_items
alter table public.lost_found_items add column if not exists warning_sent boolean default false not null;
alter table public.lost_found_items add column if not exists handover_pin text;
alter table public.lost_found_items add column if not exists handover_pin_expires_at timestamp with time zone;

-- PostgreSQL function to perform daily warning and archiving cleanup (Security Definer)
create or replace function public.cleanup_expired_notices()
returns json as $$
declare
  warning_count integer := 0;
  archive_count integer := 0;
  item_rec record;
begin
  -- 1. Warnings (25 to 30 days old, warning_sent = false)
  for item_rec in 
    select id, user_id, title 
    from public.lost_found_items 
    where status != 'returned' 
      and created_at < now() - interval '25 days'
      and created_at >= now() - interval '30 days'
      and warning_sent = false
  loop
    -- Send warning notification to owner
    insert into public.notifications (user_id, title, message, type, link)
    values (
      item_rec.user_id,
      'Notice Expiring Soon',
      'Is your item still missing? Click here to extend for 14 days, otherwise it will be archived.',
      'notice_expiration_warning',
      '/lost-found/item/' || item_rec.id
    );
    
    -- Mark warning as sent
    update public.lost_found_items 
    set warning_sent = true 
    where id = item_rec.id;
    
    warning_count := warning_count + 1;
  end loop;

  -- 2. Archiving (> 30 days old)
  for item_rec in 
    select * 
    from public.lost_found_items 
    where status != 'returned' 
      and created_at < now() - interval '30 days'
  loop
    -- Insert into archived table
    insert into public.archived_lost_found_items (
      id, user_id, type, title, description, category, images, 
      date_lost_found, time_lost_found, location, contact_info, 
      status, verification_question, qr_code_data, color, brand, 
      item_type, drop_off_location, warning_sent, created_at, updated_at, archived_at
    ) values (
      item_rec.id, item_rec.user_id, item_rec.type, item_rec.title, item_rec.description, item_rec.category, item_rec.images, 
      item_rec.date_lost_found, item_rec.time_lost_found, item_rec.location, item_rec.contact_info, 
      item_rec.status, item_rec.verification_question, item_rec.qr_code_data, item_rec.color, item_rec.brand, 
      item_rec.item_type, item_rec.drop_off_location, item_rec.warning_sent, item_rec.created_at, item_rec.updated_at, now()
    );
    
    -- Delete from active table
    delete from public.lost_found_items where id = item_rec.id;
    
    archive_count := archive_count + 1;
  end loop;

  return json_build_object('warnings_sent', warning_count, 'archived_items', archive_count);
end;
$$ language plpgsql security definer;
