# Teacher + Admin setup

1. Run `sql/schema.sql` for a new database, or run `sql/teacher-admin-migration.sql` against an existing Emmy J Code database.
2. Start the server with `npm start`.
3. Teacher accounts use `pages/teacher.html` after logging in.
4. Teachers can create classes, add students by username, assign lessons, and view class reports.
5. Admin accounts use `pages/admin.html`. For an existing user, change `account_type` to `admin` directly in MySQL after verifying the account belongs to the platform owner.

Example (replace the username):
`UPDATE users SET account_type='admin' WHERE username='your_admin_username';`
