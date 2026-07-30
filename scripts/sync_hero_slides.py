#!/usr/bin/env python3
"""
Sync hero slides into Firestore (admin).
"""
import sys
import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore

# Use service account from secrets/firebase-service-account.json
SA_PATH = Path(__file__).parent.parent / "secrets" / "firebase-service-account.json"

if not SA_PATH.exists():
    print("❌ Firebase service account not found at secrets/firebase-service-account.json")
    sys.exit(1)

cred = credentials.Certificate(str(SA_PATH))
firebase_admin.initialize_app(cred)
db = firestore.client()

# Hero slides from backend/server.py DEFAULT_SITE_CONFIG
HERO_SLIDES = [
    {"image": "/logos/Logistics-in-India.jpg", "overline": "Customs Clearance · Since 1995", "title_lines": ["Customs Clearance.", "Backed by 30 Years"], "title_span": "of Operations.", "subtitle": "India's import and export procedures are detailed, time-sensitive, and constantly evolving. Carry Fast Corporation has managed this process for Indian businesses since 1995."},
    {"image": "/logos/logistic1.jpg", "overline": "AEO Certified · Indian Customs", "title_lines": ["The Only AEO-Certified", "Customs Intermediary"], "title_span": "in Madhya Pradesh.", "subtitle": "AEO certification by Indian Customs — audited for compliance, financial soundness and operational reliability. Our clients work with a partner whose standards are independently verified."},
    {"image": "/logos/logistic3.jpg", "overline": "12,000+ Shipments · 99.5% On-Time", "title_lines": ["Cargo clears.", "Operations"], "title_span": "never wait.", "subtitle": "Bill of Entry filed the same day. Examination handled at the port by our team. Documentation pre-validated before submission. A 99.5% on-time rate maintained year after year."},
    {"image": "/logos/logistic4.jpg", "overline": "CONCOR Best Customs Broker · Since 1997", "title_lines": ["Recognised by CONCOR", "every year"], "title_span": "since 1997.", "subtitle": "An unbroken record of recognition across nearly three decades — awarded annually by Container Corporation of India for consistent operational performance."},
]

def sync_hero_slides():
    try:
        doc_ref = db.collection("site_config").document("singleton")
        doc_ref.set({"hero_slides": HERO_SLIDES}, merge=True)
        print("✅ Hero slides written to Firestore (site_config/singleton)")
        print(f"   - Total hero slides: {len(HERO_SLIDES)}")
        return True
    except Exception as e:
        print(f"❌ Error writing hero slides to Firestore: {e}")
        return False

if __name__ == "__main__":
    success = sync_hero_slides()
    sys.exit(0 if success else 1)
