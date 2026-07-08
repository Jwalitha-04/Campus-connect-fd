# Campus Connect — PRD Module: Admin Dashboard

## 1. Module Overview
The Admin Dashboard provides verified system administrators with comprehensive analytical metrics of the campus activities, user moderation tools, report verification queues, and role assignment utilities.

---

## 2. Database Schema (Target Design)

### Table: `moderation_reports`
Stores reports filed by students about flagrant posts, comments, or item listings.
```sql
create table public.moderation_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('post', 'comment', 'skill', 'item')),
  target_id uuid not null, -- references the ID in the corresponding table
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Only accessible by Admins
alter table public.moderation_reports enable row level security;
create policy "Admins have full control over reports." on public.moderation_reports
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );
```

---

## 3. Detailed Feature Specifications

### A. Dashboard Metrics & Analytics
*   **Target URL:** `/admin/dashboard`
*   **Required Dashboard Widgets:**
    *   **User Statistics:** Total Users count, monthly active users (MAU), daily active users (DAU).
    *   **Lost & Found Insights:** Total Items Reported, Return Rate percentage ($\frac{\text{Returned}}{\text{Total}} \times 100$), and "Hot Zone" Locations (e.g. Library has the highest lost item reports).
    *   **Skill Swap Analytics:** Total active matches, completed learning sessions, top traded categories (e.g. Python, UI Design).
    *   **Community Stats:** New posts per day, active commentators.
    *   **Reputation Leaderboard:** Lists of top-rated tutors and most helpful finders.
*   **Visual Representation:** Charts rendered in a tactile "drawn" style (resembling pencil sketches or marker plots, using library parameters like chart-js/recharts with custom SVG borders).

### B. User Management Panel
*   **Target URL:** `/admin/users`
*   **Admin Capabilities:**
    *   **View Directory:** Searchable table of all profiles with email, department, graduation year, reputation score, and role.
    *   **Role Override:** Multi-select dropdown to change user roles (`student` $\leftrightarrow$ `teacher` $\leftrightarrow$ `admin`). Changing a user to `teacher` triggers insertion of the **Verified Tutor** badge.
    *   **Account Action:** Temporary ban / suspension toggle (disables login via custom trigger checks in Supabase Auth schema or profile-status columns).

### C. Content Moderation Queue
*   **Target URL:** `/admin/moderation`
*   **Workflow:**
    1.  User flags a post/comment. Record is created in `moderation_reports`.
    2.  Admin views queue of pending reports.
    3.  Admin can click:
        *   **Dismiss:** Marks status `dismissed` (content remains intact).
        *   **Remove Content:** Deletes target post/comment row from database (linked records cascade delete), marks status `resolved`.
*   **UI Layout:** Reports styled as crumpled notes pinned to a separate "Discard Heap" panel on the right side of the admin corkboard.

### D. QR Desk Verification Override
*   **Target URL:** `/admin/qr-desk`
*   **Features:**
    *   Initiates camera scan interface (`html5-qrcode` integration).
    *   Admin verifies claimant ID against the generated item QR code payload.
    *   Bypasses typical finder approval (useful if finder is unresponsive or claimant retrieves item from hostel warden office).
    *   Marks item `returned` and records the override action log.
