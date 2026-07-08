-- Drop old check constraint on status
alter table public.lost_found_items drop constraint if exists lost_found_items_status_check;

-- Add updated check constraint supporting new statuses
alter table public.lost_found_items add constraint lost_found_items_status_check check (
  status = 'active' 
  or status = 'returned' 
  or status = 'in_transit'
  or status = 'at_drop_point'
  or status like 'Secured at %'
);

-- Add new handover preference columns
alter table public.lost_found_items add column if not exists handover_preference text default 'hold' check (handover_preference in ('hold', 'drop_off', 'time_limited'));
alter table public.lost_found_items add column if not exists handover_limit_time text;
alter table public.lost_found_items add column if not exists handover_limit_location text;
