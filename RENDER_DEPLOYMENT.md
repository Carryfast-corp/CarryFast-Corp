# Deployment

The backend service has been removed from the app flow. Deploy only the React frontend.

## Build

```bash
cd frontend
npm run build
```

## Required Production Environment Variables

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

## Firebase

Enable Firebase Auth, Firestore, and Firebase Storage. Configure Firestore and Storage security rules so public reads and contact lead creation are allowed, while admin writes require a valid admin profile in `users/{uid}`.
