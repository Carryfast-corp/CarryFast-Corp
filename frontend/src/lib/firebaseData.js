import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firestoreDb, firebaseStorage } from "@/lib/firebase";

const COLLECTIONS = {
  users: "users",
  siteConfig: "site_config",
  blogPosts: "blog_posts",
  leads: "leads",
};

const SITE_CONFIG_ID = "singleton";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const ensureFirestore = () => {
  if (!firestoreDb) throw new Error("Firebase Firestore is not configured. Check your Firebase config and environment variables.");
  return firestoreDb;
};

const ensureStorage = () => {
  if (!firebaseStorage) throw new Error("Firebase Storage is not configured.");
  return firebaseStorage;
};

const nowIso = () => new Date().toISOString();

const uid = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const serialize = (docSnap) => {
  const data = docSnap.data() || {};
  const normalized = Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value?.toDate) return [key, value.toDate().toISOString()];
      return [key, value];
    }),
  );
  return { id: normalized.id || docSnap.id, ...normalized };
};

const sortDesc = (items, field) =>
  items.slice().sort((a, b) => String(b[field] || "").localeCompare(String(a[field] || "")));

const stripFields = (item, fields) => {
  const next = { ...item };
  fields.forEach((field) => delete next[field]);
  return next;
};

const matchesText = (item, term, fields) => {
  const needle = (term || "").toLowerCase().trim();
  if (!needle) return true;
  return fields.some((field) => String(item[field] || "").toLowerCase().includes(needle));
};

export const subscribeSiteConfig = (onData, onError) => {
  const db = ensureFirestore();
  // Add a safety timeout so local dev can proceed when Firestore is not available.
  let called = false;
  const unsub = onSnapshot(
    doc(db, COLLECTIONS.siteConfig, SITE_CONFIG_ID),
    (snap) => {
      called = true;
      onData(snap.exists() ? serialize(snap) : null);
    },
    (err) => {
      called = true;
      if (onError) onError(err);
    },
  );

  const timeout = setTimeout(() => {
    if (called) return;
    if (process.env.NODE_ENV === "development") {
      console.warn("subscribeSiteConfig: Firestore did not respond; using development default site config");
      onData({ id: SITE_CONFIG_ID, site_name: "Local Admin", hero: null, updated_at: nowIso() });
    } else {
      if (onError) onError(new Error("Site config subscription timed out."));
    }
  }, 5000);

  return () => {
    clearTimeout(timeout);
    try {
      unsub();
    } catch (e) {}
  };
};

export const saveSiteConfig = async (config, email) => {
  const db = ensureFirestore();
  await setDoc(
    doc(db, COLLECTIONS.siteConfig, SITE_CONFIG_ID),
    { ...config, updated_at: nowIso(), updated_by: email || "" },
    { merge: true },
  );
};

export const getAdminUser = async (userUid) => {
  const db = ensureFirestore();

  try {
    console.log("Getting admin profile:", userUid);

    const snap = await getDoc(doc(db, COLLECTIONS.users, userUid));

    if (!snap.exists()) {
      console.warn("Admin profile not found:", userUid);
      return null;
    }

    return serialize(snap);
  } catch (error) {
    console.error("getAdminUser failed:", error);
    throw error;
  }
};

export const subscribeAdminUser = (userUid, onData, onError) => {
  const db = ensureFirestore();

  console.log("Subscribing to admin profile:", userUid);

  return onSnapshot(
    doc(db, COLLECTIONS.users, userUid),
    (snap) => {
      if (!snap.exists()) {
        console.warn("Admin profile not found:", userUid);
        onData(null);
        return;
      }

      onData(serialize(snap));
    },
    (error) => {
      console.error("Firestore listener error:", error.code, error.message);
      if (onError) {
        onError(error);
      }
    }
  );
};

export const subscribeAdminUsers = (onData, onError) => {
  const db = ensureFirestore();
  return onSnapshot(
    collection(db, COLLECTIONS.users),
    (snap) => onData(sortDesc(snap.docs.map(serialize), "created_at").slice(0, 500)),
    onError,
  );
};

export const saveAdminProfile = async ({ uid: userUid, email, name = "", role = "admin" }, currentEmail) => {
  const db = ensureFirestore();
  if (!userUid || !email) throw new Error("Firebase UID and email are required.");
  await setDoc(doc(db, COLLECTIONS.users, userUid), {
    uid: userUid,
    email: email.toLowerCase(),
    name,
    role,
    disabled: false,
    created_at: nowIso(),
    created_by: currentEmail || "",
  });
};

export const deleteAdminProfile = async (userUid) => {
  const db = ensureFirestore();
  await deleteDoc(doc(db, COLLECTIONS.users, userUid));
};

export const createLead = async (body) => {
  const db = ensureFirestore();
  const id = uid();
  const docBody = {
    ...body,
    id,
    created_at: nowIso(),
    status: "new",
    read: false,
  };
  await setDoc(doc(db, COLLECTIONS.leads, id), docBody);
  return docBody;
};

const filterLeads = (leads, { q = "", status = "", enquiry_type = "" } = {}) => {
  let next = leads;
  if (status) next = next.filter((lead) => lead.status === status);
  if (enquiry_type) next = next.filter((lead) => lead.enquiry_type === enquiry_type);
  if (q) next = next.filter((lead) => matchesText(lead, q, ["name", "email", "company", "message", "phone"]));
  return sortDesc(next, "created_at");
};

export const subscribeLeads = (filters, onData, onError) => {
  const db = ensureFirestore();
  const conditions = [];
  if (filters?.status) conditions.push(where("status", "==", filters.status));
  if (filters?.enquiry_type) conditions.push(where("enquiry_type", "==", filters.enquiry_type));

  const baseQuery = conditions.length
    ? query(collection(db, COLLECTIONS.leads), ...conditions, orderBy("created_at", "desc"))
    : query(collection(db, COLLECTIONS.leads), orderBy("created_at", "desc"));

  return onSnapshot(
    baseQuery,
    (snap) => onData(filterLeads(snap.docs.map(serialize), filters)),
    onError,
  );
};

export const subscribeUnreadLeadCount = (onData, onError) => {
  const db = ensureFirestore();
  return onSnapshot(
    query(collection(db, COLLECTIONS.leads), where("read", "==", false)),
    (snap) => onData(snap.size),
    onError,
  );
};

export const markAllLeadsRead = async (leads = []) => {
  await Promise.all(
    leads
      .filter((lead) => lead.read === false)
      .map((lead) => updateLead(lead.id, { read: true })),
  );
};

export const updateLead = async (id, patch) => {
  const db = ensureFirestore();
  await updateDoc(doc(db, COLLECTIONS.leads, id), patch);
};

export const deleteLead = async (id) => {
  const db = ensureFirestore();
  await deleteDoc(doc(db, COLLECTIONS.leads, id));
};

export const subscribePublishedPosts = (onData, onError) => {
  const db = ensureFirestore();
  return onSnapshot(
    query(collection(db, COLLECTIONS.blogPosts), where("status", "==", "published"), orderBy("published_at", "desc")),
    (snap) => onData(snap.docs.map(serialize).map((post) => stripFields(post, ["content"]))),
    onError,
  );
};

export const subscribeAdminPosts = (onData, onError) => {
  const db = ensureFirestore();
  return onSnapshot(
    query(collection(db, COLLECTIONS.blogPosts), orderBy("created_at", "desc"), limit(500)),
    (snap) => onData(snap.docs.map(serialize).map((post) => stripFields(post, ["content"]))),
    onError,
  );
};

export const getBlogPost = async (id) => {
  const db = ensureFirestore();
  const snap = await getDoc(doc(db, COLLECTIONS.blogPosts, id));
  return snap.exists() ? serialize(snap) : null;
};

export const getPublishedPostBySlug = async (slug) => {
  const db = ensureFirestore();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.blogPosts),
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const post = serialize(snap.docs[0]);
  await updateDoc(doc(db, COLLECTIONS.blogPosts, post.id), { views: increment(1) }).catch(() => {});
  return { ...post, views: Number(post.views || 0) + 1 };
};

const resolveSlug = async (custom, title, ignoreId = null) => {
  const base = slugify(custom || title) || uid().slice(0, 8);
  const db = ensureFirestore();
  const snap = await getDocs(collection(db, COLLECTIONS.blogPosts));
  const slugs = new Set(
    snap.docs
      .map(serialize)
      .filter((post) => post.id !== ignoreId)
      .map((post) => post.slug),
  );
  let slug = base;
  let i = 2;
  while (slugs.has(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
};

export const createBlogPost = async (body, author = "Admin") => {
  const db = ensureFirestore();
  const id = uid();
  const now = nowIso();
  const docBody = {
    ...body,
    id,
    slug: await resolveSlug(body.custom_slug, body.title),
    author,
    views: 0,
    created_at: now,
    updated_at: now,
    published_at: body.status === "published" ? now : null,
  };
  await setDoc(doc(db, COLLECTIONS.blogPosts, id), docBody);
  return docBody;
};

export const updateBlogPost = async (id, body) => {
  const db = ensureFirestore();
  const existing = await getBlogPost(id);
  if (!existing) throw new Error("Post not found.");

  const update = {
    ...body,
    updated_at: nowIso(),
  };
  if (body.custom_slug) {
    const desired = slugify(body.custom_slug);
    if (desired && desired !== existing.slug) {
      update.slug = await resolveSlug(body.custom_slug, body.title, id);
    }
  }
  if (body.status === "published" && !existing.published_at) {
    update.published_at = update.updated_at;
  }
  await updateDoc(doc(db, COLLECTIONS.blogPosts, id), update);
};

export const deleteBlogPost = async (id) => {
  const db = ensureFirestore();
  await deleteDoc(doc(db, COLLECTIONS.blogPosts, id));
};

export const uploadImage = async (file) => {
  if (!file) return null;
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) throw new Error("Unsupported image type.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File exceeds 8MB limit.");

  const storage = ensureStorage();
  const ext = (file.name || "").split(".").pop() || "jpg";
  const objectPath = `admin-uploads/${uid()}.${ext.toLowerCase()}`;
  const storageRef = ref(storage, objectPath);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000, immutable",
  });
  return getDownloadURL(storageRef);
};

export const buildAnalyticsData = (leads = [], posts = []) => {
  const recentLeads = sortDesc(leads, "created_at");
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentWindow = recentLeads.filter((lead) => new Date(lead.created_at || 0) >= fourteenDaysAgo);

  const byDay = {};
  recentWindow.forEach((lead) => {
    const day = String(lead.created_at || "").slice(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
  });

  const timeline = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const date = d.toISOString().slice(0, 10);
    return { date, leads: byDay[date] || 0 };
  });

  const byType = {};
  recentWindow.forEach((lead) => {
    const type = lead.enquiry_type || "General";
    byType[type] = (byType[type] || 0) + 1;
  });

  return {
    kpis: {
      leads_total: leads.length,
      leads_new: leads.filter((lead) => lead.status === "new").length,
      leads_unread: leads.filter((lead) => lead.read === false).length,
      posts_total: posts.length,
      posts_published: posts.filter((post) => post.status === "published").length,
      blog_views: posts.reduce((sum, post) => sum + Number(post.views || 0), 0),
    },
    timeline,
    enquiry_breakdown: Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    recent_leads: recentLeads.slice(0, 8),
    ga4: null,
  };
};

export const leadsToCsv = (leads = []) => {
  const rows = [
    ["Created At", "Name", "Email", "Phone", "Company", "Designation", "Enquiry Type", "Status", "Message", "ID"],
    ...leads.map((lead) => [
      lead.created_at || "",
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.company || "",
      lead.designation || "",
      lead.enquiry_type || "",
      lead.status || "",
      String(lead.message || "").replace(/\n/g, " | "),
      lead.id || "",
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
};