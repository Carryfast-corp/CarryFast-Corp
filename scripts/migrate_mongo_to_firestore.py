#!/usr/bin/env python3
"""
Migrate site_config (and optionally other collections) from MongoDB to Firestore.

Usage: set MONGO_URL and DB_NAME in backend/.env (the script will load it),
then run: python3 scripts/migrate_mongo_to_firestore.py

This script reads the `site_config` document with _id 'singleton' from Mongo
and writes the document into Firestore under collection `site_config` document 'singleton'.
"""
import os
import sys
from pathlib import Path
import json
from dotenv import load_dotenv

try:
    from pymongo import MongoClient
except Exception:
    print("Please install pymongo: pip install pymongo")
    sys.exit(1)

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:
    print("Please install firebase-admin: pip install firebase-admin")
    sys.exit(1)

# Load repository env
repo_root = Path(__file__).parent.parent
load_dotenv(repo_root / ".env")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

if not MONGO_URL or not DB_NAME:
    print("❌ MONGO_URL or DB_NAME not set in .env")
    sys.exit(1)

# Firestore service account
SA_PATH = repo_root / "secrets" / "firebase-service-account.json"
if not SA_PATH.exists():
    print(f"❌ Firebase service account not found at {SA_PATH}")
    sys.exit(1)

cred = credentials.Certificate(str(SA_PATH))
firebase_admin.initialize_app(cred)
fs = firestore.client()

def migrate_site_config():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    try:
        doc = db.site_config.find_one({"_id": "singleton"})
        if not doc:
            print("No site_config singleton found in MongoDB.")
            return False
        # Remove Mongo-specific _id if present
        doc.pop("_id", None)
        # Firestore: write the doc into site_config/singleton
        fs.collection("site_config").document("singleton").set(doc, merge=True)
        print("✅ Migrated site_config -> Firestore")
        return True
    except Exception as e:
        print(f"❌ Error migrating site_config: {e}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    ok = migrate_site_config()
    sys.exit(0 if ok else 1)
