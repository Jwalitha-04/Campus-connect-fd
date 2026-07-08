# Campus Connect — PRD Module: System Architecture & Non-Functional Requirements

## 1. Module Overview
This module details the overarching technical system architecture, data flow paths, skeuomorphic theme asset management, user trust/reputation scoring systems, automated email layouts, and security/performance constraints for Campus Connect.

---

## 2. Technical Stack Mapping

The application is deployed on Vercel as a hybrid Next.js application, utilising Supabase for back-end services.

| Layer | Selected Tech | Usage details |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router) | Serves server-side rendered layout, client page components, and Server Actions. |
| **Styling Engine** | Tailwind CSS | Utility-first CSS class injection mapped to corkboard token configs. |
| **Authentication** | Supabase Auth | Handles signup, login, email verification, session cookies. |
| **Database** | Supabase PostgreSQL | Stores profiles, listings, comments, matches, ratings. |
| **Realtime Notifications** | Supabase Realtime | Subscribes to table insertions/updates (chat, new matches, claim reviews). |
| **Object Storage** | Supabase Storage | Hosts avatar buckets and attachment buckets. |
| **Email Transport** | Resend / SendGrid API | Delivers transactional mailers and session calendar ICS files. |
| **Deployment Platform** | Vercel | Automatic CI/CD linked to GitHub main repository. |

---

## 3. Trust & Reputation System (Gamification Rules)

To build accountability, profiles track a dynamic reputation score and display system-generated badges.

### A. Point Matrix
*   **Returning a lost item:** +20 Reputation Points (on claim approval).
*   **Completing a Skill Swap session:** +15 Reputation Points (once marked complete by both).
*   **Receiving 5-star tutoring review:** +10 Reputation Points.
*   **Unsolicited helpful post reaction:** +2 Reputation Points.

### B. Verification Badges
1.  **Verified Finder:**
    *   *Trigger:* Returned at least 3 lost items (where claim status is `approved`).
    *   *Badge Icon:* Red pushpin with a tiny magnifying glass.
2.  **Verified Tutor:**
    *   *Trigger:* Completed 5 skill swap sessions with an average rating of 4.5+ stars.
    *   *Badge Icon:* Brass pin with a graduation cap.
3.  **Trusted Member:**
    *   *Trigger:* Reputation score exceeding 150 points.
    *   *Badge Icon:* Gold star sticker pinned to the user's avatar.

---

## 4. Global Notification System

### A. In-App Realtime Notifications
*   **Setup:** App layout initializes a global Supabase channel subscribing to `notifications` table changes for the active `auth.uid()`.
*   **Triggers:**
    *   *Lost & Found Match:* A new potential match is flagged by edge match script.
    *   *Claim Attempt:* Another student submits a claim form for user's found item.
    *   *Session Update:* Meeting rescheduled or cancelled.
    *   *New Chat Message:* Received while outside the active chat room.
*   **UX Alert:** Shows a hanging warning tag (mini yellow sticky note) that flutters at the top right of the corkboard.

### B. Transactional Email Alerts
*   Send via Resend/SendGrid from `noreply@campusconnect.edu`.
*   **Templates:**
    1.  *Verify Email:* On signup.
    2.  *Potential Match:* Notifies finder and loser with links to the shared board.
    3.  *Meeting Confirmation:* Sends an `.ics` calendar invitation file attachment on session acceptance.
    4.  *Meeting Reminder:* Cron job fires an email 2 hours before scheduled meetings.

---

## 5. Non-Functional Requirements (NFR)

### A. Performance & Optimization
*   **Image Optimization:** All user-uploaded images must pass through Next.js `<Image />` component or client-side compression (e.g. `browser-image-compression`) prior to Supabase Storage upload. Max resolution capped at 1200px width.
*   **Caching Strategy:** Cache public community posts via Next.js ISR (Incremental Static Regeneration) with a 60-second revalidation window. Revalidate cache on new post insertion.
*   **Load Time:** Ensure main corkboard rendering has a Largest Contentful Paint (LCP) under 2.5 seconds on college Wi-Fi.

### B. Security & Row Level Security (RLS)
*   No database tables may be accessed directly without RLS policies enforced.
*   **Environment Safety:** All API secrets (Supabase Service Key, Resend Key) must reside strictly on the server and must NEVER be exposed via `NEXT_PUBLIC_` prefixes.
*   **File Upload Filter:** Storage bucket access policies restrict uploads to valid MIME types (e.g., `image/jpeg`, `image/png`, `application/pdf`) and size limits.

### C. Reliability & Backup
*   Weekly automated Supabase database backups.
*   Graceful degradation: If Supabase Realtime socket disconnects, the client wiggles a push-pin notification indicator and falls back to HTTP polling every 30 seconds.
*   Robust error boundary capture formatting crash reports as crumpled, fallen post-its with a reload button.

---

## 6. Future Enhancements Roadmap

1.  **AI-Powered Recommendations:** Implement vector embedding similarity search using pgvector inside Supabase to automatically link complex descriptional matches.
2.  **Campus Map Integration:** Pin lost/found item coordinates onto an interactive SVG campus floor plan map.
3.  **Push Notifications:** Service worker integration for browser native push notifications.
4.  **Multi-Campus Support:** Allow scaling to multiple colleges under unified domain checks.
