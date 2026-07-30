# Project architecture: Firebase-only frontend

This repository's frontend is a Create React App single-page application deployed as a static site (Vercel). All application data, authentication, and file storage are handled by Firebase: Firestore, Firebase Auth, and Firebase Storage. There is no external backend server (FastAPI / MongoDB / Python) used by the running application.

Key points:
- Frontend SPA: [frontend](frontend)
- Data store: Firestore collections — `users`, `site_config`, `blog_posts`, `leads` (accessed via [frontend/src/lib/firebaseData.js](frontend/src/lib/firebaseData.js#L1-L40)).
- Auth: Firebase Auth (admin access determined by a `users/{uid}` document with `role: "admin"`). See [frontend/src/contexts/AuthContext.jsx](frontend/src/contexts/AuthContext.jsx#L1-L200).
- Storage: Firebase Storage for admin image uploads (rules limit types and size — see `storage.rules`).
- No external server: removed references to any external backend URL, MongoDB, FastAPI, Python, or axios usage in the frontend bundle.

Security & rules:
- Firestore security rules are in [firestore.rules](firestore.rules#L1-L200) and enforce admin-only writes and public read for published blog posts and site config. Leads can be created publicly but read/modify/delete are admin-only.
- Storage rules are in [storage.rules](storage.rules#L1-L200) and restrict admin uploads to image types under 8MB.

Deployment:
- The app is a static SPA (see [frontend/vercel.json](frontend/vercel.json#L1-L20)). Deploy to Vercel or any static host after building.

If you need any server-side integrations (email on new lead, scheduled tasks), we will implement them as Firebase Cloud Functions so the stack remains serverless inside Firebase.

See the summary below for exact files changed and remaining risk areas before deploying.
