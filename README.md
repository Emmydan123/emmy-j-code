# Emmy J Code

A frontend-first learning platform project for **Emmy J Code**.

## What is in this package

- Responsive multi-page frontend
- Beginner onboarding with one question per screen
- Student/Teacher account-type selection
- Registration fields: name, email, phone, country, username, password, avatar
- Demo login flow
- Placement assessment
- Student dashboard with XP, coins and rank
- Beginner / Intermediate / Advanced curriculum structure
- Separate programming unlock concept
- Lesson + mastery test flow with 80% pass requirement
- Focused drag/drop practice lab
- Achievements and leaderboard screens
- Teacher dashboard shell
- Rank configuration
- Lesson narration script and captions
- Media folders ready for images/audio/video

## Important

This is the **frontend/content foundation pack**, not the final production system.

The browser demo uses localStorage only. It is NOT production authentication and does not securely store passwords.

The next development phase is the Node.js + MySQL backend:
- secure password hashing
- real sessions/authentication
- users and roles
- courses/modules/lessons
- question banks and attempts
- progress and idempotent submissions
- XP/coins/ranks/streaks
- teacher classes and reports
- payments/programming access
- certificates
- notifications
- audit logs
- offline sync

## Running it

You can open `index.html` for basic static pages. For the best local development workflow, use VS Code and a local static server/Live Server.

## Brand name

The correct product name is **Emmy J Code**. No EJEmmyJ branding is used.

## Backend
The project now includes a Node.js + MySQL backend. See `BACKEND-SETUP.md`, `server/`, `sql/`, `.env.example`, and `js/auth-api.js`.
