#!/usr/bin/env python3
"""
Sync testimonials into Firestore (admin).
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

# Testimonials from frontend/src/pages/Home.jsx
TESTIMONIALS = {
    "heading": "What Our Clients Say",
    "subtitle": "Client feedback from importers and exporters who rely on Carry Fast.",
    "items": [
        {"quote": "We have worked with Carry Fast for several years across imports of machinery and industrial equipment. Their team understands customs requirements thoroughly and consistently delivers timely clearances.", "author": "— Client Name", "company": "Company"},
        {"quote": "Carry Fast has been a dependable customs partner for our business. Documentation is handled accurately, communication is prompt, and shipment status is always clear.", "author": "— Client Name", "company": "Company"},
        {"quote": "Their knowledge of customs procedures has helped us avoid unnecessary delays on multiple shipments. We value their practical approach and responsiveness.", "author": "— Client Name", "company": "Company"},
        {"quote": "We handle regular imports through multiple ports, and Carry Fast has consistently maintained the same level of service and attention to detail across every shipment.", "author": "— Client Name", "company": "Company"},
        {"quote": "The team understands the urgency of commercial cargo. Whenever issues arise, they work quickly to resolve them and keep the clearance process moving.", "author": "— Client Name", "company": "Company"},
        {"quote": "Carry Fast combines experience with accountability. Their guidance on documentation and compliance has been valuable to our import operations.", "author": "— Client Name", "company": "Company"},
        {"quote": "Professional, responsive, and reliable. Their team has supported our customs clearance requirements efficiently and continues to be a trusted logistics partner.", "author": "— Client Name", "company": "Company"},
    ],
}

def sync_testimonials():
    try:
        doc_ref = db.collection("site_config").document("singleton")
        doc_ref.set({"testimonials": TESTIMONIALS}, merge=True)
        print("✅ Testimonials written to Firestore (site_config/singleton)")
        print(f"   - Total testimonials: {len(TESTIMONIALS['items'])}")
        return True
    except Exception as e:
        print(f"❌ Error writing testimonials to Firestore: {e}")
        return False

if __name__ == "__main__":
    success = sync_testimonials()
    sys.exit(0 if success else 1)
