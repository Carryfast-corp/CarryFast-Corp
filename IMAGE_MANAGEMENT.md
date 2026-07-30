# Image Management Guide

This project is fully serverless: image uploads go to Firebase Storage and public assets are served from the frontend build.

## Firebase Storage Uploads
- Admin image uploads are stored under `admin-uploads/` in Firebase Storage.
- The React admin panel uploads files directly to Firebase Storage and uses the returned download URL.
- Firestore Security Rules restrict writes to authenticated admin users only.

## Static Assets
- Static image assets should live in `frontend/public/logos/` or be referenced by absolute URLs.
- Public site images should use storage URLs or bundled public assets, not legacy backend `/uploads/` paths.

## Legacy /uploads/ Paths
If older content contains `/uploads/...` references, those are legacy backend URLs and should be replaced with Firebase Storage download URLs or public asset paths.

## Recommended Practice
- Use Cloud Storage URLs returned by the upload flow for admin-image fields.
- Keep static design images in `frontend/public/logos/`.
- Do not rely on a separate backend web server to serve uploaded files.

