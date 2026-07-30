# Firebase Frontend Setup

This project now runs as a frontend-only React app backed by Firebase.

## Local Development

```bash
cd frontend
npm start
```

Configure `frontend/.env` or `.env.local` with:

```env
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_ADMIN_URL=/cfc-admin-control-room
```

## Firebase Services

- Firebase Auth handles admin sign-in.
- Firestore stores admin profiles, site config, blog posts, and leads.
- Firebase Storage stores admin-uploaded images.
- Firestore realtime listeners update public site content and admin views live.

## Admin Users

Create the login in Firebase Console first, then add a matching Firestore admin profile from the admin panel using that user's Firebase UID.

## Deploy

Deploy the `frontend` app to Vercel, Firebase Hosting, Netlify, or any static host. No backend service is required.
