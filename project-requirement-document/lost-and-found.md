# Campus Connect — PRD Module: Lost & Found

## 1. Module Overview
The Lost & Found module allows students and staff to list lost or found items, tag locations, answer security questions to verify ownership, generate QR codes for offline verification desks, and receive automated matching notifications.

---

## 2. Database Schema (Target Design)

### Table: `lost_found_items`
```sql
create table public.lost_found_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  description text not null,
  category text not null, -- e.g., 'electronics', 'books', 'documents', 'clothing', 'keys', 'other'
  images text[] default '{}'::text[], -- Storage URLs
  date_lost_found date not null,
  time_lost_found time without time zone,
  location text not null, -- tagged campus zone
  contact_info text not null,
  status text not null default 'active' check (status in ('active', 'returned')),
  verification_question text, -- Required for 'found' items, optional for 'lost'
  qr_code_data text, -- text embedded in the QR Code
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.lost_found_items enable row level security;

-- RLS Policies
create policy "Everyone can view active items." on public.lost_found_items
  for select using (true);

create policy "Authenticated users can create items." on public.lost_found_items
  for insert with check (auth.uid() = user_id);

create policy "Owners can update their own items." on public.lost_found_items
  for update using (auth.uid() = user_id);
```

### Table: `claims`
Tracks verification and claim requests between finder and claimant.
```sql
create table public.claims (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.lost_found_items(id) on delete cascade not null,
  claimant_id uuid references public.profiles(id) on delete cascade not null,
  answer text not null, -- claimant's response to verification question
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.claims enable row level security;

-- RLS Policies
create policy "Claimants and Finders can view their claims." on public.claims
  for select using (
    auth.uid() = claimant_id or 
    auth.uid() = (select user_id from public.lost_found_items where id = item_id)
  );

create policy "Authenticated users can insert claims." on public.claims
  for insert with check (auth.uid() = claimant_id);

create policy "Finders can update claim status." on public.claims
  for update using (
    auth.uid() = (select user_id from public.lost_found_items where id = item_id)
  );
```

---

## 3. Detailed Feature Specifications

### A. Item Posting Workflow
*   **Target URL:** `/lost-found/report`
*   **Step-by-Step Form:**
    1.  **Selection:** User picks report type ("I lost something" vs. "I found something").
    2.  **Item Details:** Title, description, category.
    3.  **Visuals:** Drag-and-drop file uploader. Uploads files to Supabase Storage Bucket `lost-found-images/`. (Max 3 images, 4MB each, compression applied client-side).
    4.  **Metadata:** Date of event, approximate time, contact info.
    5.  **Location Tagging:** Select dropdown (Library, Cafeteria, Hostel, Auditorium, Parking Area, Academic Blocks, Sports Complex).
    6.  **Verification Setup:**
        *   If *Found Report*: User MUST write a verification question (e.g. *"What is the lock screen wallpaper?"* or *"Describe the keychain attached to it"*). The answer is not stored in the database; it will be evaluated manually by the finder upon receiving claims.
        *   If *Lost Report*: Question is optional.
    7.  **QR Code Generation:** The system automatically generates a unique identifier string (e.g. `cc-lf-{uuid}`) saved in `qr_code_data`.
*   **UX Note:** Card wiggles and falls onto the corkboard on submission.

### B. Claim & Verification System
1.  **Initiating a Claim:**
    *   A student finds a lost item's card on the board.
    *   Clicks "Claim Item" button (styled as a tear-off ticket stub).
    *   A modal opens displaying the finder's Verification Question.
    *   Claimant submits their answer. A new record in `claims` is created with status `pending`.
2.  **Evaluating a Claim:**
    *   Finder receives a notification of a claim attempt.
    *   Finder navigates to `/profile/claims` and reads the claimant's answer.
    *   Finder clicks either **Approve** or **Reject**.
    *   If *Approved*:
        *   The claim status changes to `approved`.
        *   The item status in `lost_found_items` changes to `returned`.
        *   Triggers an animated "RETURNED" rubber-stamp overlay on the card.
        *   Finder earns 10 Reputation Points (updates `profiles.reputation_points`).
    *   If *Rejected*:
        *   Claim status changes to `rejected`. The item remains `active` on the board.

### C. Campus Location Tagging
*   Filters on the main board allow filtering cards by location tags.
*   Pins on cards show a tiny customized map icon or colored push-pin corresponding to the location.

### D. QR Code Verification (Physical Hand-off)
*   Each report detail page (`/lost-found/item/[id]`) renders an SVG QR code using `react-qr-code` containing the URL `/lost-found/verify/[id]`.
*   **Verification Desks (e.g., Hostel Warden or Security Office):**
    1.  Desks can scan the physical or digital QR code shown by a claimant.
    2.  Scanning directs the staff member to the verification page.
    3.  The page displays the item photos, finder profile, claimant profile, and claim status.
    4.  Verification desk staff can click "Verify Hand-Off" which marks the item `returned` in one click.

### E. Smart Matching Engine
*   **Background Cron/Trigger:** Whenever a new `lost` or `found` report is posted, a Supabase Edge Function runs a matching algorithm.
*   **Matching Rules:**
    *   Title similarity: Case-insensitive keyword matching (e.g. "iPhone" matches "iPhone 13").
    *   Category matching: Strict match (e.g. both are 'electronics').
    *   Location match: Strict zone matching.
    *   Date proximity: Within 3 days of each other.
*   **Match Threshold:** If a potential match score is above 60%, the system:
    1.  Creates a database link (represented visually as the Red String SVG).
    2.  Sends in-app notifications and email alerts to both parties ("We found a potential match for your lost item!").
