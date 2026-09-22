# Emmy J Code Backend — Local Setup

## 1. Install dependencies
Open the project terminal:

    npm install

## 2. Create the database
Open MySQL (for example MySQL Workbench or the MySQL terminal) and run `sql/schema.sql`.

## 3. Configure environment
Copy `.env.example` to `.env` and put in your local MySQL password.

## 4. Start

    npm start

Open: http://localhost:3000

The backend now provides secure password hashing, sessions, registration/login/logout, onboarding storage, lesson progress, quiz attempts, XP/coins and duplicate reward protection.

## Learning experience migration
Run `sql/learning-experience-migration.sql` once after the base/assessment migrations. It adds notifications, bookmarks, notes, study activity, and revision data.
