# Development Roadmap — Phase 2: Lost & Found Core Features

This phase builds the core posting engine, listing board, search filters, and detail cards for the Lost & Found module.

---

## 1. Objectives & Deliverables
*   Initialize the `lost_found_items` database table with Row Level Security (RLS) policies.
*   Configure the Supabase Storage bucket for storing item photos.
*   Implement the multi-step posting form for Lost/Found reports.
*   Build the core board listing grid with custom visual offset cards.
*   Implement location-based filtering tabs and details views.
*   Implement inline QR Code generation on item detail pages.

---

## 2. Step-by-Step Task List

### Task 2.1: Database Tables & Storage Migration
Execute this SQL migration in your Supabase SQL Editor:
```sql
-- Create lost_found_items table
create table public.lost_found_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  description text not null,
  category text not null check (category in ('electronics', 'books', 'documents', 'clothing', 'keys', 'other')),
  images text[] default '{}'::text[],
  date_lost_found date not null,
  time_lost_found time without time zone,
  location text not null check (location in ('Library', 'Cafeteria', 'Hostel', 'Auditorium', 'Parking Area', 'Academic Blocks')),
  contact_info text not null,
  status text not null default 'active' check (status in ('active', 'returned')),
  verification_question text,
  qr_code_data text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.lost_found_items enable row level security;

-- Policies
create policy "Everyone can view active items." on public.lost_found_items
  for select using (true);

create policy "Authenticated users can create items." on public.lost_found_items
  for insert with check (auth.uid() = user_id);

create policy "Owners can update their own items." on public.lost_found_items
  for update using (auth.uid() = user_id);

-- Storage bucket creation
-- Note: Create a public storage bucket named 'lost-found-images' in Supabase dashboard.
```

### Task 2.2: Implement File Upload System
*   Create a reusable uploader component `src/components/shared/ImageUploader.tsx`.
*   Uses `browser-image-compression` to resize uploads to a maximum width of 1200px and compress quality to 80% on-client.
*   Uploads files to Supabase Storage Bucket `lost-found-images` under path `public/${item_id}/${filename}`.
*   Exposes array of public URLs on completion.

### Task 2.3: Build Item Report Posting Form
*   Create posting page at `/lost-found/report`.
*   Implement form fields:
    *   Toggle Switch (styled as visual stamp choice): "Lost Report" (Red pin) vs "Found Report" (Green pin).
    *   Title, Description, Category selection.
    *   Image uploader widget (max 3 images).
    *   Date of event, time, contact information.
    *   Location picker (Library, Cafeteria, Hostel, Auditorium, Parking Area, Academic Blocks).
    *   **Conditional input:** If "Found Report" is selected, the "Verification Question" text area field becomes **mandatory** (e.g., "Describe the keychain attached to the keys").
*   On Submission:
    1.  Generates a unique QR identifier string: `cc-lf-${uuid}`.
    2.  Inserts record into `lost_found_items` table.
    3.  Redirects back to `/lost-found`.

### Task 2.4: Build the Corkboard Listings View
*   Create notice board landing page at `/lost-found`.
*   Implement layout:
    *   Notice board header using serif display typography (`Playfair Display`).
    *   Sidebar containing checkboxes for filtering by Location Zones, and radio selectors for Category types.
    *   Masonry grid displaying cards (`columns-1 md:columns-2 lg:columns-3 gap-6`).
    *   Card rotation utility class that applies random rotations (e.g. `rotate-1`, `-rotate-2`, `rotate-2`) via mapping calculations to represent pinned notes.
*   Render custom SVG pushpins at the top center of each card (Red pin for lost items, Green pin for found items).
*   Add hover scales: `hover:-translate-y-2 hover:rotate-0 hover:shadow-paper-lift transition-all`.

### Task 2.5: Build Details View with QR Codes
*   Create item details dynamic routing at `/lost-found/item/[id]`.
*   Implement layout:
    *   Double-wide aged index card (`bg-paper-cream`, notebook margins details).
    *   Render full-size image gallery carousel.
    *   Provide date, location, category metadata list.
    *   Render **SVG QR Code** component dynamically using `react-qr-code` package:
        *   Value: `https://campusconnect.edu/lost-found/verify/${item.id}` (or relative dev URL).
        *   Caption: "For verification desk scanning".
*   Render a "Claim Ticket" action button (with perforated stub detailing the item number) at the bottom.

---

## 3. UI/UX Elements to Implement
*   **Custom Pushpins:** Render absolute-positioned pushpin SVG on cards.
*   **Torn bottom edges:** Apply `.torn-bottom-clip` or hand-cut SVG borders on lists elements.
*   **Reward Badge:** Floating yellow tape sticker for lost items that have rewards toggled.

---

## 4. Verification & Testing Checklist
1.  **Form Validations:** Verify you cannot submit a "Found Report" without entering a Verification Question.
2.  **Storage Verification:** Confirm uploading multiple images saves them to Supabase Storage and returns active URL arrays.
3.  **Masonry Rotation:** Check listing view to confirm notes render with irregular alignments and that hover transitions straighten them out smoothly.
4.  **QR Code Check:** Scan the generated QR code on details cards using a smartphone camera to verify it parses the correct URL path.
