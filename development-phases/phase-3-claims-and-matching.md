# Development Roadmap — Phase 3: Claim Verification & Smart Matching

This phase implements ownership verification claims, the finder's validation dashboard, automated similarity matching triggers, and the dynamic Red String connection visuals.

---

## 1. Objectives & Deliverables
*   Create the database schema for the `claims` table with restrictive RLS policies.
*   Implement the dynamic verification submission modal on details pages.
*   Build the Finder's Claim Review page with Approve/Reject actions and database triggers.
*   Set up the Smart Matching Engine (database function or API checker).
*   Implement the React-based SVG Red String canvas to draw catenary curves between matching item cards.

---

## 2. Step-by-Step Task List

### Task 3.1: Claims Schema Setup
Execute this SQL migration in your Supabase SQL Editor:
```sql
-- Create claims table
create table public.claims (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.lost_found_items(id) on delete cascade not null,
  claimant_id uuid references public.profiles(id) on delete cascade not null,
  answer text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.claims enable row level security;

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
```

### Task 3.2: Implement Claim Submission Modal
*   On `/lost-found/item/[id]`, if user is not the owner:
    *   Bind "Claim Item" button (the tear-off ticket stub).
    *   Clicking opens a Dialog modal styled as a pinned note sheet.
    *   Load the item's `verification_question` dynamically.
    *   Display a textarea for the claimant's answer.
*   On submission:
    1.  Inserts record into `public.claims`.
    2.  Sets status to `pending`.
    3.  Displays a success check stamp: "Ticket Submitted".

### Task 3.3: Build the Finder's Review Dashboard
*   Create routing path at `/profile/claims`.
*   Retrieve all active reports posted by the current user that have pending claims:
    *   Select from `lost_found_items` where `user_id = auth.uid()`.
    *   Join `claims` and the claimant's `profiles`.
*   Provide a side-by-side view:
    *   Left side: Found item details + verification question.
    *   Right side: Claimant answer list card with profile score details.
*   **Approve / Reject Action Buttons:**
    *   *Approve:*
        1.  Calls server action updating `claims.status` to `approved`.
        2.  Updates `lost_found_items.status` to `returned`.
        3.  Triggers database trigger or action to add +20 points to Finder's `profiles.reputation_points`.
        4.  Triggers visual rubber stamp transition "APPROVED".
    *   *Reject:*
        1.  Updates `claims.status` to `rejected`.
        2.  Keeps the item listings active on the board.

### Task 3.4: Implement Smart Matching Logic
*   Create a Supabase Database Function or Next.js API Route `/api/matches/detect` that runs whenever a new report is added.
*   **Matching Rules:**
    1.  Select records from the opposite type (if new is `lost`, look at `found`).
    2.  Filter by same `category`.
    3.  Filter by same `location`.
    4.  Compare dates: `abs(new.date_lost_found - existing.date_lost_found) <= 3`.
    5.  Check text similarity: split title into keywords and match at least one word.
*   If matches are identified, insert a match flag record or create notifications.

### Task 3.5: Implement the Red String Visualizer
*   Create a global overlay SVG canvas element `src/components/matching/StringOverlay.tsx`.
*   Uses a `resize` listener and `getBoundingClientRect()` to compute exact center offsets of two matching card IDs:
    *   Node A: Center pin of Lost Item Card.
    *   Node B: Center pin of Found Item Card.
*   **Catenary Curve Formula:**
    *   $x_A, y_A$ = coordinates of pin A.
    *   $x_B, y_B$ = coordinates of pin B.
    *   $mid_X = (x_A + x_B) / 2$.
    *   $mid_Y = \max(y_A, y_B) + 120$ (represents gravity weight sag).
    *   Path output: `M xA yA Q midX midY xB yB`.
*   **Font Load Fix:** Bind `document.fonts.ready` check inside `useEffect` hook to recalculate coords after Playfair/Caveat fonts finish loading and dimensions stabilize.
*   **Animation:** Animate `stroke-dashoffset` from length of path to 0 on entry.

---

## 3. UI/UX Elements to Implement
*   **APPROVED Rubber Stamp:** An absolute positioned overlay graphic angled at `-8deg` that scales down aggressively with a bounce (`animate-stamp-in`) on approved claims.
*   **Dashed Perforation Division:** Ticket buttons use a dashed border separating stub IDs.

---

## 4. Verification & Testing Checklist
1.  **Restrictive RLS:** Verify that a user who is neither the finder nor the claimant receives a database permission error when attempting to select a claim.
2.  **Reputation Point Math:** Register a claim, approve it, and query the profiles table to verify that the finder's reputation point balance increased by exactly 20.
3.  **Red String Drawing:** Load a matched pair of cards. Resize the browser window to confirm the SVG red string coordinates recalculate dynamically and snap to the cards correctly.
4.  **Font Alignment Check:** Ensure that reload tests do not leave the red string misaligned before custom fonts complete loading.
