# Campus Connect — PRD Module: Authentication & Profile Management

## 1. Module Overview
This module handles secure user authentication, onboarding, session management, user roles (Student, Teacher, Admin), and profiles. The system leverages **Supabase Auth** as the identity provider and **Supabase Database** for storing profiles and roles.

---

## 2. Database Schema (Target Design)

### Table: `profiles`
Stores student, faculty, and admin profiles. Tied to Supabase `auth.users` via foreign key.

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  bio text,
  department text not null,
  graduation_year integer, -- Nullable for teachers/admins
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  reputation_points integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- RLS Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);
```

---

## 3. Core Features & User Flows

### A. User Registration (Signup)
*   **Target URL:** `/auth/signup`
*   **Form Fields:**
    *   Full Name (input string, required)
    *   Campus Email Address (input string, required, must end with academic domain, e.g., `.edu` or specific college domain)
    *   Department (dropdown selection, required)
    *   Graduation Year (dropdown selection, required for Students)
    *   Password (password string, required, min 8 chars, must contain 1 uppercase letter, 1 number, 1 special character)
    *   Confirm Password (password string, must match Password)
*   **On Submission:**
    1.  Calls `supabase.auth.signUp()`.
    2.  Upon success, user profile metadata is inserted into `public.profiles` via a database trigger on `auth.users` insert, or manually via API.
    3.  Redirects to `/auth/verify-email` displaying a success screen instructing the user to check their academic mailbox.

### B. Email Verification
*   **Workflow:**
    1.  User receives confirmation email from Supabase containing a link with an access token.
    2.  Clicking the link redirects the user to `/auth/callback?type=signup` which handles session establishment.
    3.  User is redirected to the home board `/`.
    4.  *Resend Verification:* A button on `/auth/verify-email` allows resending the email with a 60-second debounce timer.

### C. User Login
*   **Target URL:** `/auth/login`
*   **Form Fields:**
    *   Email Address (input string)
    *   Password (password string)
    *   Remember Me (checkbox)
*   **On Submission:**
    1.  Calls `supabase.auth.signInWithPassword()`.
    2.  Successful auth sets local browser cookies (handled automatically by Next.js Auth Helpers).
    3.  Redirects to `/` (Home Notice Board).
    4.  *Error States:* Displays alerts for "Invalid credentials", "Email not verified", or "Network error".

### D. Forgot Password & Recovery
*   **Target URL:** `/auth/forgot-password`
*   **Workflow:**
    1.  User enters verified email.
    2.  App triggers `supabase.auth.resetPasswordForEmail()`.
    3.  Email containing recovery link is sent.
    4.  Clicking recovery link redirects user to `/auth/reset-password` (secured via URL access token).
    5.  User enters new password and submits, which calls `supabase.auth.updateUser()`.
    6.  Session is updated, redirects to `/auth/login` with success banner.

### E. Session Management
*   **Next.js Server Actions / Middleware:**
    *   Use Supabase SSR Package (`@supabase/ssr`) to manage cookies securely on server and client.
    *   Middleware checks for active sessions:
        *   Unauthenticated users requesting `/` or other dashboard routes are redirected to `/auth/login`.
        *   Authenticated users requesting `/auth/login` or `/auth/signup` are redirected to `/`.
    *   Sessions automatically expire after 7 days unless refreshed.
    *   *Auto-Logout:* Triggered if credentials are changed elsewhere or token renewal fails.

### F. Profile Customization & Onboarding
*   **Target URL:** `/profile/edit`
*   **Features:**
    *   **Avatar Upload:** Uploads image to Supabase Storage Bucket `avatars/`. Crop utility limits sizes to square aspect ratio (max 2MB, JPG/PNG). Stores public URL in `profiles.avatar_url`.
    *   **Biography:** Markdown text area (max 300 characters) for user summary.
    *   **Contact Information:** Allows adding contact tags (e.g., WhatsApp, Discord, Email) with visibility toggle (e.g. only visible to matching parties).

---

## 4. Role-Based Access Control (RBAC)

The application supports three roles defined in `profiles.role`:

1.  **Student (Default):**
    *   *Permissions:* Post lost/found reports, request/post/rate skill swaps, participate in community discussions, message peers.
    *   *Restrictions:* No admin dashboard access, cannot delete community posts created by others.
2.  **Teacher:**
    *   *Permissions:* Same as Student, plus a special **Verified Tutor** profile badge displayed next to their posts.
3.  **Administrator:**
    *   *Permissions:* Full access to `/admin`, view system metrics, delete any post/listing across Lost & Found, Skill Swap, and Community, modify roles of users.

---

## 5. UI/UX & Theming Guidelines (Tactile Integration)
*   **Registration Card:** Styled as a clean double-wide lined Index Card.
*   **Auth Fields:** Inputs look like handwritten text sitting on pencil-ruled horizontal lines.
*   **Login Button:** Styled as a physical stamp ("ENTER") that wiggles on hover and slams down with scale on click.
*   **Loading spinner:** A wiggling push-pin trying to stick into the corkboard.
