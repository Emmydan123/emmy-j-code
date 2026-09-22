# Emmy J Code — Mobile, Offline & PWA

This build adds the installable Progressive Web App foundation, responsive mobile metadata, and a service worker.

## Local test
1. Run the Node server with `npm start`.
2. Open the site through `http://localhost:3000` (not `file://`).
3. Use a browser's install option when available.
4. Test offline after the service worker has cached the shell.

## Important
The service worker caches the app shell and GET requests. Authentication/API requests remain online so secure server data stays on the backend. Offline progress synchronization will be expanded in the sync phase.

## Android
This web/PWA build is the source foundation for the Android package. The final APK should be produced after the mobile UI and offline-sync testing pass.
