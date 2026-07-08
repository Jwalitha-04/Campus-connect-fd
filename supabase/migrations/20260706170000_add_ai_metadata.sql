-- Add AI-detected metadata columns to lost_found_items table
alter table public.lost_found_items 
add column if not exists color text,
add column if not exists brand text,
add column if not exists item_type text;
