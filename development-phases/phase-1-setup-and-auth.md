# Development Roadmap — Phase 1: Project Setup, Design Tokens, & Authentication

This phase sets up the foundations of the Next.js workspace, Tailwind configuration, Supabase databases, authentication gates, and profile setup.

---

## 1. Objectives & Deliverables
*   Initialize Next.js application with TypeScript, ESLint, and Tailwind CSS.
*   Configure Tailwind config with corkboard/paper custom color tokens, font configurations, box shadows, and keyframe animations.
*   Configure Supabase client using server-side cookie-based session management (`@supabase/ssr`).
*   Establish the database user profile schema (`public.profiles` table), automated sync trigger, and security RLS policies.
*   Implement signup, email verification callback, login, session guard middleware, and onboarding profile setup.

---

## 2. Step-by-Step Task List

### Task 1.1: Bootstrap Next.js and Install Dependencies
*   Initialize project:
    `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir`
*   Install core packages:
    `npm install @supabase/ssr @supabase/supabase-js browser-image-compression class-variance-authority clsx tailwind-merge`
*   Add fonts in Next.js layout using `@next/font/google`:
    *   `Playfair Display` (variable: `--font-playfair`)
    *   `Work Sans` (variable: `--font-worksans`)
    *   `Caveat` (variable: `--font-caveat`)
    *   `Space Mono` (variable: `--font-space-mono`)

### Task 1.2: Configure Tailwind Custom Tokens
Overwrite/Extend `tailwind.config.js` with the tokens defined in `design.md`:
*   Add custom themes for `cork`, `paper`, `string`, `pin`, `chalk`, and `highlight`.
*   Extend `fontFamily` mapping custom font CSS variables.
*   Add custom shadows: `cork-inner`, `paper-lift`, `paper-lift-dark`, `pin-shadow`.
*   Define custom keyframes: `pin-stick`, `wiggle`, `draw-string`, `flutter`, `stamp-in`.
*   Create global CSS class definitions in `src/app/globals.css` for custom masking components: `.ticket-clip`, `.torn-bottom-clip`, and `.cork-noise`.

### Task 1.3: Supabase Database Sync & SQL Profiles setup
Execute the following SQL migration in your Supabase SQL Editor:
```sql
-- Create public profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  bio text,
  department text not null,
  graduation_year integer,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  reputation_points integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Profiles are publicly readable." on public.profiles
  for select using (true);

create policy "Users can edit their own profiles." on public.profiles
  for update using (auth.uid() = id);

-- Trigger to copy user credentials from auth.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, department, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Campus Member'),
    coalesce(new.raw_user_meta_data->>'department', 'Undeclared'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Task 1.4: Cookie Session Middleware & Client Setup
*   Create environment configurations: `.env.local` containing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
*   Set up Supabase SSR utilities:
    *   `src/utils/supabase/server.ts` (Instantiates client using cookies for Server Actions and Server Components).
    *   `src/utils/supabase/client.ts` (Instantiates browser client).
    *   `src/utils/supabase/middleware.ts` (Refreshes session cookies on server headers).
*   Create Route Protection Guard inside `src/middleware.ts` to redirect:
    *   Redirect unauthenticated users accessing `/` or `/profile` to `/auth/login`.
    *   Redirect logged-in sessions trying to hit `/auth/login` or `/auth/signup` back to home `/`.

### Task 1.5: Signup, Login, and Password Recovery Views
*   Create Signup page (`/auth/signup`) using the index-card design containing form inputs (Name, Email, Password, Department, Graduation Year).
*   Create Login page (`/auth/login`) with error validation messages.
*   Create Verification callback router page (`/auth/callback/route.ts`) to exchange query verification tokens for authorization cookies and redirect to `/`.
*   Create Password recovery requests page (`/auth/forgot-password`) and Password Reset entry form (`/auth/reset-password`).

### Task 1.6: Profile Setup & Storage Buckets
*   Create Supabase Storage Bucket `avatars` with public access permissions.
*   Create uploader component inside `/profile/edit` page:
    *   Compresses images on-client using `browser-image-compression` to under 500KB.
    *   Uploads profile image file named `${profile_id}.png` using `supabase.storage.from('avatars').upload()`.
    *   Saves the public asset url in `profiles.avatar_url`.
*   Provide profile parameters updates (bio, contact links tags grid).

---

## 3. UI/UX Elements to Implement
*   **Auth Wrapper Card:** Textured index card styling (`bg-paper-cream`, bordered, slightly offset rotated `-rotate-1`, deep shadows `shadow-paper-lift`).
*   **Text Inputs:** Horizontal lined paper fields (`border-b border-sky-200 focus:border-amber-400 bg-transparent py-1 font-sans`).
*   **Confirm Button:** Visual thick red-stamp action button wiggling slightly on hover.

---

## 4. Verification & Testing Checklist
1.  **Next.js Dev Server:** Verify server runs locally (`npm run dev`) and loads font variables correctly without warnings.
2.  **Tailwind Integration:** Add a temporary card element verifying `cork-bg` coloring, `paper-lift` shadow drop, and `.ticket-clip` notches punch out cleanly.
3.  **Supabase Auth Flow:**
    *   Sign up a dummy student user checking email receiving.
    *   Verify checking your mailbox triggers successful verification callback.
    *   Confirm user record successfully duplicated profile entry inside the PostgreSQL database `profiles` table.
4.  **Security Gate Validation:** Attempt requesting path `/` while logged out to verify redirection to `/auth/login` functions. Log in and request `/auth/login` to confirm redirection to `/`.
