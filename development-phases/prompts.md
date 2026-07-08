# Campus Connect — Agent Development Prompts

This document contains copy-pasteable prompts to feed to your AI development agent for each phase. It instructs the agent on coding tasks, system linkage, visual styling rules, environment configurations, and safety constraints.

---

## 🛠️ Global Agent Instructions (Rules for all Phases)

Before starting any phase, ensure your agent adheres to these rules:
1.  **Read Context Files:** Read [design.md](file:///c:/Users/Sumanth%20Murari/Documents/campus-connect/design.md) for styling guidelines and the corresponding file inside [project-requirement-document/](file:///c:/Users/Sumanth%20Murari/Documents/campus-connect/project-requirement-document) for feature detail.
2.  **Environment Sync:** At the end of each phase, list any new `.env.local` parameters needed (e.g., API keys, URLs) and describe how to verify them.
3.  **Ambiguity Guard:** If details or specifications are missing or ambiguous, stop and ask the user to clarify before writing code.
4.  **Database Security:** Every table created must have Row-Level Security (RLS) enabled with policies matching the requirements.
5.  **Aesthetics Policy:** Do not use default Tailwind styling or templates. Stick to the corkboard/lined paper aesthetic tokens, fonts, and animations.
6.  **Supabase MCP Tooling:** You must strictly use the Supabase MCP server tools (e.g., `execute_sql`, `list_tables`, `list_migrations`, etc.) to run database operations, inspect schemas, and apply migrations directly.

---

## 🔑 Phase 1 Prompt: Setup & Authentication

```markdown
You are an expert Next.js and Supabase developer. We are building "Campus Connect", a digital notice board.
Your task is to implement "Phase 1: Project Setup & Authentication" in the workspace.

Please review the following files before writing code:
- c:\Users\Sumanth Murari\Documents\campus-connect\design.md (for custom themes, fonts, colors, and global CSS styles)
- c:\Users\Sumanth Murari\Documents\campus-connect\project-requirement-document\auth-and-profile.md (for auth PRD details)
- c:\Users\Sumanth Murari\Documents\campus-connect\development-phases\phase-1-setup-and-auth.md (for step-by-step tasks)

You must use the Supabase MCP server tools to interact with the database, query schemas, and perform SQL migrations.

Implement the following:
1. Bootstrap Next.js with TypeScript and Tailwind CSS.
2. Extend the Tailwind config with the custom cork/paper colors, font families, shadows, and animations from design.md. Import fonts (Playfair Display, Work Sans, Caveat, Space Mono).
3. Set up client-side and server-side Supabase SSR Clients using cookies.
4. Create the `public.profiles` database schema in Supabase with RLS, and the database trigger to copy new user records from auth.users on signup.
5. Implement route protection middleware to block unauthenticated requests to `/` and redirect to `/auth/login`.
6. Implement Signup, Login, Email Verification Callback, and Profile edit/onboarding pages (including avatar uploader connected to Supabase avatars storage bucket).

Rule for End of Phase:
List any environment variables that need to be added to `.env.local` (e.g., Supabase URLs, Anon Keys). Inform me if you did not have access to any credentials or database permissions, and explain how I can verify this phase.
```

---

## 🔍 Phase 2 Prompt: Lost & Found Core Features

```markdown
You are an expert Next.js and Supabase developer. We are building "Campus Connect".
Your task is to implement "Phase 2: Lost & Found Core Features" in the workspace.

Please review the following files:
- c:\Users\Sumanth Murari\Documents\campus-connect\design.md
- c:\Users\Sumanth Murari\Documents\campus-connect\project-requirement-document\lost-and-found.md
- c:\Users\Sumanth Murari\Documents\campus-connect\development-phases\phase-2-lost-and-found-core.md
- Linkage: This phase builds directly on Phase 1, using Supabase Auth sessions, profiles table columns, and custom styling.

You must use the Supabase MCP server tools to interact with the database, query schemas, and perform SQL migrations.

Implement the following:
1. Create the `public.lost_found_items` database table in Supabase PostgreSQL with RLS and categories, locations, and type constraints.
2. Build the client uploader utilizing browser compression, and save images to a storage bucket named `lost-found-images`.
3. Create the Posting Form at `/lost-found/report` with category and location dropdowns. If a user chooses "Found Report", make the "Verification Question" mandatory.
4. Build the Corkboard Listings View at `/lost-found` featuring a masonry grid of cards. Apply random card Y-rotation classes (`rotate-1`, `-rotate-2`, etc.) and pin styling based on design.md.
5. Build the details page `/lost-found/item/[id]` which displays descriptions, images, a claim button (perforated claim ticket styling), and a generated QR Code.

Rule for End of Phase:
List any Supabase dashboard setups needed (e.g., storage buckets, policy configs). Let me know if any details were missing or if I need to update my environment variables.
```

---

## 🧵 Phase 3 Prompt: Claim Verification & Smart Matching

```markdown
You are an expert Next.js and Supabase developer. We are building "Campus Connect".
Your task is to implement "Phase 3: Claim Verification & Smart Matching".

Please review:
- c:\Users\Sumanth Murari\Documents\campus-connect\design.md
- c:\Users\Sumanth Murari\Documents\campus-connect\project-requirement-document\lost-and-found.md
- c:\Users\Sumanth Murari\Documents\campus-connect\development-phases\phase-3-claims-and-matching.md
- Linkage: This phase connects with Phase 2's `lost_found_items` table and the details page's claim ticket triggers, plus Phase 1's user profiles reputation scoring.

You must use the Supabase MCP server tools to interact with the database, query schemas, and perform SQL migrations.

Implement:
1. Create the `public.claims` database schema and configure RLS permissions (viewable by claimant and finder only).
2. Create the Claim Verification modal dialog. When a claimant clicks "Claim" on an item details page, prompt them with the finder's security question.
3. Build the Finder's review page `/profile/claims` displaying the answer list. Support actions: "Approve" (marks claim approved, updates item status to returned, adds +20 reputation points, and shows stamp anim) or "Reject" (marks claim rejected).
4. Implement the Smart Matching algorithm to auto-match listings by category, location, dates, and title keywords.
5. Implement the React SVG String Canvas overlay. Draw animated catenary paths connecting matched cards using pin coordinate calculations. Account for dynamic Web Font load shifts using document.fonts listeners.

Rule for End of Phase:
Detail any test setups or Supabase triggers I should execute to verify the matching engine. Identify if any parameters were missing, and list env steps.
```

---

## 🤝 Phase 4 Prompt: Skill Swap Module

```markdown
You are an expert Next.js and Supabase developer. We are building "Campus Connect".
Your task is to implement "Phase 4: Skill Swap Module".

Please review:
- c:\Users\Sumanth Murari\Documents\campus-connect\design.md
- c:\Users\Sumanth Murari\Documents\campus-connect\project-requirement-document\skill-swap.md
- c:\Users\Sumanth Murari\Documents\campus-connect\development-phases\phase-4-skill-swap.md
- Linkage: This module relies on the custom design tokens (blue pins, Space Mono ticket numbers) and links to the reputation point triggers and badge displays.

You must use the Supabase MCP server tools to interact with the database, query schemas, and perform SQL migrations.

Implement:
1. Run migrations for `skills`, `swap_matches`, `sessions`, `chat_messages`, and `ratings` tables with secure RLS.
2. Build the Skill Swap landing page `/skill-swap` separating "Skills Offered" and "Skills Wanted" with a Masonry layout. Show automatic matches.
3. Build the Session Scheduler inside `/skill-swap/match/[id]` to request, reschedule, accept, and complete learning events.
4. Implement the Match Chat Room with real-time Supabase subscriptions and attachment sharing (up to 10MB PDFs/ZIPs saved to `swap-attachments`).
5. Build the post-session Rating Survey updating profile reputation (+15 completed, +10 five-star review) and Verified Tutor badges.

Rule for End of Phase:
Explain how to verify the calendar invites and database reputation calculations. List missing details or env configurations.
```

---

## 💬 Phase 5 Prompt: Community Features & Notification Engine

```markdown
You are an expert Next.js and Supabase developer. We are building "Campus Connect".
Your task is to implement "Phase 5: Community Features & Notification Engine".

Please review:
- c:\Users\Sumanth Murari\Documents\campus-connect\design.md
- c:\Users\Sumanth Murari\Documents\campus-connect\project-requirement-document\community.md
- c:\Users\Sumanth Murari\Documents\campus-connect\development-phases\phase-5-community-and-notifications.md
- Linkage: This links community Q&A questions with Solved stamp animations and feeds matches alerts via real-time triggers.

You must use the Supabase MCP server tools to interact with the database, query schemas, and perform SQL migrations.

Implement:
1. Migrate database tables: `posts`, `comments`, and `post_reactions` with proper RLS.
2. Build `/community` feed showing Discussions, Announcements, Q&A, and Resources with visual categorizations.
3. Build `/community/post/[id]` supporting 2-level recursive comment trees. Author can mark answers solved, pinning comments to the top with a green highlighter stamp.
4. Build custom card reactions (Heart, Pin, Check) rendering outline marker drawings.
5. Create a global notification listener `NotificationListener.tsx` mounted on layout root, rendering alerts as hanging sticky note warnings.
6. Configure the Resend SDK to trigger transactional match notifications and meeting reminders.

Rule for End of Phase:
List any Resend API variables I need to insert into `.env.local` to test emails. Let me know if any requirements were missing or need verification.
```

---

## 🛡️ Phase 6 Prompt: Admin Dashboard & Skeuomorphic Polish

```markdown
You are an expert Next.js and Supabase developer. We are building "Campus Connect".
Your task is to implement "Phase 6: Admin Dashboard & Skeuomorphic Polish".

Please review:
- c:\Users\Sumanth Murari\Documents\campus-connect\design.md
- c:\Users\Sumanth Murari\Documents\campus-connect\project-requirement-document\admin-dashboard.md
- c:\Users\Sumanth Murari\Documents\campus-connect\development-phases\phase-6-admin-and-polish.md
- Linkage: This wraps up the admin dashboard metrics, flags moderation queues, web webcam scans overrides, ambient shadows themes, accessibility guards, and audio sprite integrations.

You must use the Supabase MCP server tools to interact with the database, query schemas, and perform SQL migrations.

Implement:
1. Create `moderation_reports` table with RLS restricted to admins.
2. Build admin pages at `/admin/dashboard` (charts using drawn marker aesthetics) and `/admin/moderation` (reports queue details).
3. Build the QR Code hand-off overrides scanner at `/admin/qr-desk` using camera video overlays via `html5-qrcode`.
4. Implement the skeuomorphic Audio Engine `audio.ts` (buffered MP3 audio sprite file containing thocks, tears, plucks, and stamp thuds) with mutes setting.
5. Implement Time-of-day ambient shadows themes (cooler morning, short midday, warm evening, night board dark mode).
6. Configure prefers-reduced-motion safety overrides in Tailwind classes, test builds, and audit Vercel deployment logs.

Rule for End of Phase:
Provide verification procedures for QR scans overrides, ambient themes, and sound toggles. List missing files, credentials, or env instructions.
```
