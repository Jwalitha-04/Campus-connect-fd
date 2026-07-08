# Campus Connect – Project Requirements Document (PRD)

## 1. Project Overview

**Project Name:** Campus Connect

**Tagline:** A digital campus notice board for finding lost items, exchanging skills, and helping students connect.

Campus Connect is a web-based platform designed for college campuses that combines three major services into one application:

1. **Lost & Found**
2. **Skill Swap**
3. **Community**

The platform uses a **corkboard and claim-ticket visual theme**, featuring cork textures, paper cards, red string connectors, and handwritten-style elements to resemble a physical campus notice board.

---

# 2. Problem Statement

Students often face the following issues:

* Losing personal belongings and having no centralized place to report them.
* Difficulty finding peers who can teach or learn specific skills.
* Lack of an organized platform for community discussions and collaboration.
* Existing solutions are fragmented and do not provide a campus-specific experience.

Campus Connect addresses these issues by creating a single, secure, and engaging platform.

---

# 3. Objectives

* Create a centralized campus utility platform.
* Simplify the process of reporting and claiming lost items.
* Enable peer-to-peer learning and skill exchange.
* Improve campus engagement through community interactions.
* Build trust through verification and reputation systems.

---

# 4. Target Users

* Students
* Faculty Members
* Club Coordinators
* Campus Administrators

---

# 5. Technology Stack

| Layer              | Technology                        |
| ------------------ | --------------------------------- |
| Frontend           | Next.js                           |
| Backend APIs       | Node.js                           |
| Database           | Supabase PostgreSQL               |
| Authentication     | Supabase Auth                     |
| Realtime Features  | Supabase Realtime                 |
| File Storage       | Supabase Storage                  |
| ORM                | Supabase Client                   |
| Styling            | Tailwind CSS                      |
| State Management   | React Context / Zustand           |
| Notifications      | Supabase Realtime + Email Service |
| Email Service      | Resend / SendGrid                 |
| QR Code Generation | react-qr-code / qrcode            |
| Deployment         | Vercel                            |
| Version Control    | Git & GitHub                      |

---

# 6. System Architecture

```text
Next.js Frontend
        ↓
Node.js API Layer
        ↓
Supabase Services
        ├── Authentication
        ├── PostgreSQL Database
        ├── Realtime
        └── Storage
```

---

# 7. Core Modules

## Module 1: Authentication System

### Features

* User Registration
* User Login
* Forgot Password
* Email Verification
* Session Management
* Profile Creation
* Role-Based Access Control

### User Roles

* Student
* Teacher
* Administrator

---

# Module 2: Lost & Found

## Features

### Item Posting

Users can create:

* Lost Item Report
* Found Item Report

### Item Information

* Item Name
* Description
* Category
* Images
* Date
* Time
* Location
* Contact Information

---

## Claim Verification System

Before an item is marked as claimed:

1. Finder creates a verification question.
2. Claimant answers the question.
3. Finder verifies the answer.
4. Item status changes to "Returned".

---

## Campus Location Tagging

Users can tag locations such as:

* Library
* Cafeteria
* Hostel
* Auditorium
* Parking Area
* Academic Blocks

---

## QR Code Verification

Each lost item report generates a unique QR code.

### Workflow

1. QR code generated.
2. Verification desk scans QR code.
3. Claim details are displayed.
4. Item is verified and returned.

---

## Smart Matching

Automatically detect possible matches using:

* Description similarity
* Location similarity
* Date and time similarity

---

## Lost & Found Notifications

Notify users when:

* A matching item is found.
* Someone attempts to claim an item.
* Claim request is approved or rejected.

---

# Module 3: Skill Swap

## Features

### Skill Posting

Each post contains:

* Skill Name
* Description
* Category
* Availability
* Proficiency Level

---

## Offering vs Wanting

Users can create:

### Offering

Skills they can teach.

### Wanting

Skills they want to learn.

---

## Proficiency Levels

* Beginner
* Intermediate
* Advanced

---

## Barter-Based Matching

Example:

Student A:

* Offers Python
* Wants UI Design

Student B:

* Offers UI Design
* Wants Python

The system automatically suggests a match.

---

## Meeting Scheduling

Users can:

* Request a session
* Accept a session
* Reschedule
* Cancel
* Mark session completed

Meeting details:

* Date
* Time
* Location
* Meeting Link

---

## Notifications

Users receive notifications for:

* New session requests
* Session acceptance
* Session cancellation
* Upcoming meetings

---

## Email Notifications

Emails contain:

* Meeting Date
* Meeting Time
* Meeting Location
* Session Reminder

---

## Chat System

Features:

* One-to-one messaging
* Real-time communication
* File sharing
* Doubt clarification

---

## Ratings and Feedback

After a session:

* Student rates tutor
* Tutor rates student
* Feedback is stored in profiles

---

# Module 4: Community

## Features

* Public discussions
* Announcements
* Event sharing
* Resource sharing
* Club updates
* Question and answer posts

---

# 8. Notification System

### In-App Notifications

* New skill match
* Item match
* Meeting reminders
* Chat messages

### Email Notifications

* Session reminders
* Claim approvals
* Important announcements

---

# 9. Trust and Reputation System

## Reputation Score

Points are earned for:

* Returning lost items
* Completing skill sessions
* Receiving positive ratings

---

## Verification Badges

### Verified Finder

Successfully returned lost items.

### Verified Tutor

Completed skill swap sessions.

### Trusted Member

Maintains high ratings and positive contributions.

---

# 10. Admin Dashboard

## Dashboard Metrics

* Total Users
* Active Users
* Lost Items Posted
* Items Returned
* Most Lost Locations
* Most Swapped Skills
* Total Meetings
* Top Rated Tutors
* Most Helpful Users

---

# 11. User Interface Theme

## Design Theme

Digital Corkboard.

### Visual Elements

* Cork background textures
* Cream paper cards
* Red string SVG connectors
* Push pins
* Handwritten notes
* Claim tickets

---

## Typography

### Headings

Playfair Display

### Handwritten Notes

Caveat

### Body Text

Inter

---

# 12. Dark Mode

Night Board Theme.

Features:

* Dark cork texture
* Brown paper cards
* Soft lighting effects
* Visible red strings
* Warm shadows

---

# 13. Micro-Interactions

* Pinning animation when creating posts
* Torn paper transitions
* Sticky note hover effects
* Animated add-post button
* Paper lifting effect
* Card drop animation

---

# 14. Non-Functional Requirements

## Performance

* Fast page loading
* Real-time updates

## Security

* Authentication and authorization
* Secure database policies
* Protected APIs

## Scalability

* Modular architecture
* Database indexing
* Reusable components

## Reliability

* Data backup
* Error handling
* Logging

---

# 15. Future Enhancements

* AI-powered recommendations
* Mobile application
* Campus map integration
* Push notifications
* Multi-campus support
* Calendar synchronization

---

# 16. Expected Outcomes

* Faster recovery of lost items.
* Better peer-to-peer learning opportunities.
* Increased student collaboration.
* Improved campus engagement.
* A unified digital platform for campus activities.
