#!/usr/bin/env node

const { resolve } = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(__dirname, "../secrets/firebase-service-account.json");

const firebaseProject = process.env.FIREBASE_PROJECT_ID;

if (!firebaseProject && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Missing FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS environment variable."
  );
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);

  initializeApp({
    credential: cert(serviceAccount),
    projectId: firebaseProject || serviceAccount.project_id,
  });
} catch (err) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      `Could not load service account from ${serviceAccountPath}`
    );
    console.error(err.message);
    process.exit(1);
  }

  initializeApp({
    projectId: firebaseProject,
  });
}

const db = getFirestore();

const nowIso = () => new Date().toISOString();

(async () => {
  try {
    console.log("Seeding Firestore...");

    // ---------------------------------------------------------------------
    // Site Config
    // ---------------------------------------------------------------------

    const siteConfigRef = db.doc("site_config/singleton");

    await siteConfigRef.set(
      {
        id: "singleton",

        company: {
          name: "Carry Fast Corporation",
          short: "Carry Fast",
          tagline: "Custom Broker · Est. 1995",
          logo_url: "/logos/CFC Logo Only-Photoroom.png",
        },

        contact: {
          phone_primary: "+91 731 2524079",
          email: "info@carryfastcorp.com",
          address_line_1: "502, A Block, Corporate House",
          address_line_2: "169 R.N.T. Marg, Indore — 452001",
        },

        hero_slides: [
          {
            image: "/logos/LOGISTIC1STimage.png",
            overline: "Customs Clearance · Since 1995",
            title_lines: [
              "Customs Clearance.",
              "Backed by 30 Years",
            ],
            title_span: "of Operations.",
            subtitle:
              "India's import and export procedures are detailed, time-sensitive, and constantly evolving.",
          },
        ],

        updated_at: nowIso(),
        updated_by: "seed-script",
      },
      { merge: true }
    );

    console.log("✅ Seeded site_config/singleton");

    // ---------------------------------------------------------------------
    // Blog
    // ---------------------------------------------------------------------

    const blogRef = db.doc("blog_posts/welcome-to-carry-fast");

    await blogRef.set(
      {
        id: "welcome-to-carry-fast",
        title: "Welcome to Carry Fast Corporation",
        slug: "welcome-to-carry-fast",
        author: "Carry Fast Team",
        status: "published",

        content:
          "<p>Carry Fast Corporation is your customs brokerage partner for reliable import and export clearance across India.</p>",

        summary:
          "Carry Fast Corporation is your customs brokerage partner for reliable import and export clearance across India.",

        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: nowIso(),
        views: 0,
      },
      { merge: true }
    );

    console.log("✅ Seeded blog_posts/welcome-to-carry-fast");

    // ---------------------------------------------------------------------
    // Admin User
    // ---------------------------------------------------------------------

    const adminUserRef = db.doc("users/admin");

    await adminUserRef.set(
      {
        uid: "admin",
        email: "admin@carryfastcorp.com",
        name: "Admin",
        role: "admin",
        disabled: false,
        created_at: nowIso(),
        created_by: "seed-script",
      },
      { merge: true }
    );

    console.log("✅ Seeded users/admin");

    console.log("\n🎉 Firestore seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Firestore seeding failed:");
    console.error(err);
    process.exit(1);
  }
})();