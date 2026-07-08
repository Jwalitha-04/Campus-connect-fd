-- Add drop_off_location column and update status check constraint
alter table public.lost_found_items add column if not exists drop_off_location text;

alter table public.lost_found_items drop constraint if exists lost_found_items_status_check;
alter table public.lost_found_items add constraint lost_found_items_status_check check (
  status = 'active' 
  or status = 'returned' 
  or status like 'Secured at %'
);
