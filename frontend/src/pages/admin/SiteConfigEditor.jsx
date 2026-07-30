import { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { saveSiteConfig, uploadImage } from "@/lib/firebaseData";
import { toast } from "sonner";
import { useSiteConfigCtx } from "@/contexts/SiteConfigContext";
import { DEFAULT_POLICIES, POLICY_TITLES } from "@/lib/defaultPolicies";
import { resolveAssetUrl } from "@/lib/assets";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { key: "company", label: "Company" },
  { key: "contact", label: "Contact Info" },
  { key: "stats", label: "Stats" },
  { key: "hero_slides", label: "Hero Slides" },
  { key: "page_heroes", label: "Page Heroes" },
  { key: "testimonials", label: "Testimonials" },
  { key: "policies", label: "Policies" },
  { key: "footer", label: "Footer" },
  { key: "social", label: "Social Links" },
];

const PAGE_HERO_PAGES = [
  { key: "about", label: "About Us", path: "/about", image: "/logos/aboutus.jpg" },
  { key: "expertise", label: "Our Expertise", path: "/expertise", image: "/logos/LOGISTIC1STimage.png" },
  { key: "services", label: "Our Services", path: "/services", image: "/logos/contact.png" },
  { key: "clients", label: "Our Clients", path: "/clients", image: "/logos/ourclients2.jpg" },
  { key: "blog", label: "Blog", path: "/blog", image: "/logos/blogs.jpg" },
  { key: "contact", label: "Contact Us", path: "/contact", image: "/logos/contact us.jpg" },
];

const DEFAULT_PAGE_HEROES = PAGE_HERO_PAGES.reduce((acc, page) => {
  acc[page.key] = { image: page.image };
  return acc;
}, {});

const normalizePageHeroes = (pageHeroes = {}) => {
  const next = { ...pageHeroes };
  if (next.expertise?.image?.endsWith("/uploads/LOGISTIC1STimage.png")) {
    next.expertise = { ...next.expertise, image: "/logos/LOGISTIC1STimage.png" };
  }
  return next;
};

export default function SiteConfigEditor() {
  const ctx = useSiteConfigCtx();
  const { user } = useAuth();
  const [tab, setTab] = useState("company");
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [policyKey, setPolicyKey] = useState("privacy-policy");

  useEffect(() => {
    setCfg({
      ...(ctx?.config || {}),
      page_heroes: normalizePageHeroes({ ...DEFAULT_PAGE_HEROES, ...(ctx?.config?.page_heroes || {}) }),
      policies: { ...DEFAULT_POLICIES, ...(ctx?.config?.policies || {}) },
    });
  }, [ctx?.config]);

  const setField = (section, key, value) => setCfg((c) => ({ ...c, [section]: { ...(c[section] || {}), [key]: value } }));
  const setSection = (section, value) => setCfg((c) => ({ ...c, [section]: value }));
  const setPageHeroImage = (pageKey, image) => setCfg((c) => ({
    ...c,
    page_heroes: {
      ...(c.page_heroes || {}),
      [pageKey]: { ...((c.page_heroes || {})[pageKey] || {}), image },
    },
  }));

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setField("company", "logo_url", url);
    } catch (e) {
      toast.error(e?.message || "Logo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (file, onUrl) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (typeof onUrl === "function") onUrl(url);
      return url;
    } catch (e) {
      toast.error(e?.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (!cfg) return <div className="p-10 text-slate-500">Loading…</div>;

  const save = async () => {
    setBusy(true);
    try {
      const { _id, updated_at, updated_by, ...payload } = cfg;
      await saveSiteConfig(payload, user?.email);
      toast.success("Saved. Live site config updated.");
    } catch (e) {
      toast.error(e?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-white border border-slate-200 px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:border-gold-500 rounded-sm";

  return (
    <div className="p-8 lg:p-10 max-w-5xl space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-overline">Dynamic Content</div>
          <h1 className="font-display font-extrabold text-3xl text-navy-900 mt-1">Site Content</h1>
          <p className="mt-2 text-sm text-slate-600">Edit any number, contact detail, or copy block shown on the public website. Changes go live immediately on save.</p>
        </div>
        <button onClick={save} disabled={busy} data-testid="site-config-save" className="inline-flex items-center gap-2 bg-gold-500 text-white px-5 py-3 text-sm font-semibold hover:bg-gold-600 disabled:opacity-50">
          <Save size={16} /> {busy ? "Saving…" : "Save Changes"}
        </button>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`tab-${t.key}`}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                    tab === t.key ? "border-gold-500 text-gold-500" : "border-transparent text-slate-500 hover:text-navy-900"
                  }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-5">
          <Field label="Company Name"><input className={input} value={cfg.company?.name || ""} onChange={(e) => setField("company", "name", e.target.value)} /></Field>
          <Field label="Short Name"><input className={input} value={cfg.company?.short || ""} onChange={(e) => setField("company", "short", e.target.value)} /></Field>
          <Field label="Tagline"><input className={input} value={cfg.company?.tagline || ""} onChange={(e) => setField("company", "tagline", e.target.value)} /></Field>
          <Field label="Logo URL / Upload">
            <div className="space-y-3">
              <input className={input} value={cfg.company?.logo_url || ""} onChange={(e) => setField("company", "logo_url", e.target.value)} placeholder="https://... or Firebase Storage URL" />
              <label className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 px-4 py-2 text-sm text-navy-900 hover:border-gold-500 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} disabled={uploading} />
                {uploading ? "Uploading logo…" : "Upload logo file"}
              </label>
            </div>
          </Field>
          {cfg.company?.logo_url && <div className="md:col-span-2"><img src={resolveAssetUrl(cfg.company.logo_url)} alt="Company logo" className="h-16 object-contain" /></div>}
        </div>
      )}

      {tab === "contact" && (
        <div className="bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-5">
          <Field label="Phone (Primary)"><input className={input} value={cfg.contact?.phone_primary || ""} onChange={(e) => setField("contact", "phone_primary", e.target.value)} /></Field>
          <Field label="Phone (Secondary)"><input className={input} value={cfg.contact?.phone_secondary || ""} onChange={(e) => setField("contact", "phone_secondary", e.target.value)} /></Field>
          <Field label="Phone (Direct)"><input className={input} value={cfg.contact?.phone_direct || ""} onChange={(e) => setField("contact", "phone_direct", e.target.value)} /></Field>
          <Field label="Phone (Urgent / WhatsApp display)"><input className={input} value={cfg.contact?.phone_urgent || ""} onChange={(e) => setField("contact", "phone_urgent", e.target.value)} /></Field>
          <Field label="WhatsApp Number (digits only, no +)"><input className={input} value={cfg.contact?.whatsapp_number || ""} onChange={(e) => setField("contact", "whatsapp_number", e.target.value)} /></Field>
          <Field label="Email"><input className={input} value={cfg.contact?.email || ""} onChange={(e) => setField("contact", "email", e.target.value)} /></Field>
          <Field label="Address Line 1"><input className={input} value={cfg.contact?.address_line_1 || ""} onChange={(e) => setField("contact", "address_line_1", e.target.value)} /></Field>
          <Field label="Address Line 2"><input className={input} value={cfg.contact?.address_line_2 || ""} onChange={(e) => setField("contact", "address_line_2", e.target.value)} /></Field>
          <Field label="Address Line 3"><input className={input} value={cfg.contact?.address_line_3 || ""} onChange={(e) => setField("contact", "address_line_3", e.target.value)} /></Field>
          <Field label="Working Hours"><input className={input} value={cfg.contact?.working_hours || ""} onChange={(e) => setField("contact", "working_hours", e.target.value)} /></Field>
          <Field label="Map Query (Google Maps search)"><input className={input} value={cfg.contact?.map_query || ""} onChange={(e) => setField("contact", "map_query", e.target.value)} /></Field>
        </div>
      )}

      {tab === "stats" && (
        <ListEditor
          items={cfg.stats || []}
          onChange={(v) => setSection("stats", v)}
          newItem={() => ({ value: 0, suffix: "", label: "", sub: "" })}
          fields={[
            { key: "value", label: "Value (number)", type: "number" },
            { key: "suffix", label: "Suffix (e.g. +, %)" },
            { key: "label", label: "Label" },
            { key: "sub", label: "Sub-text", textarea: true },
          ]}
        />
      )}

      {tab === "hero_slides" && (
        <ListEditor
          items={cfg.hero_slides || []}
          onChange={(v) => setSection("hero_slides", v)}
          newItem={() => ({ image: "", overline: "", title_lines: ["", ""], title_span: "", subtitle: "" })}
          onUpload={handleImageUpload}
          uploading={uploading}
          fields={[
            { key: "image", label: "Image URL / Upload", preview: true, upload: true },
            { key: "overline", label: "Overline" },
            { key: "title_lines", label: "Title lines (one per line)", multiline_array: true },
            { key: "title_span", label: "Title accent (gold)" },
            { key: "subtitle", label: "Subtitle", textarea: true },
          ]}
        />
      )}

      {tab === "page_heroes" && (
        <div className="bg-white border border-slate-200 p-6 space-y-5">
          <div>
            <div className="text-overline">Inner Page Heroes</div>
            <p className="mt-2 text-sm text-slate-600">Update the hero image shown at the top of each public page.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {PAGE_HERO_PAGES.map((page) => {
              const image = cfg.page_heroes?.[page.key]?.image || page.image;
              return (
                <div key={page.key} className="border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display font-bold text-lg text-navy-900">{page.label}</div>
                      <div className="mt-1 text-xs font-mono text-slate-500">{page.path}</div>
                    </div>
                    <a href={page.path} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gold-500 hover:text-gold-600">View</a>
                  </div>
                  <div className="mt-4 space-y-3">
                    <input
                      className={input}
                      value={image}
                      onChange={(e) => setPageHeroImage(page.key, e.target.value)}
                      placeholder="https://... or /uploads/image.png"
                    />
                    <label className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 px-4 py-2 text-sm text-navy-900 hover:border-gold-500 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files?.[0], (url) => setPageHeroImage(page.key, url))}
                        disabled={uploading}
                      />
                      {uploading ? "Uploading image..." : "Upload image file"}
                    </label>
                    {image && <img src={resolveAssetUrl(image)} alt="" className="h-32 w-full object-cover border border-slate-200" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "testimonials" && (
        <>
          <div className="bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-5">
            <Field label="Section Heading"><input className={input} value={cfg.testimonials?.heading || ""} onChange={(e) => setField("testimonials", "heading", e.target.value)} /></Field>
            <Field label="Section Subtitle" full><textarea rows={3} className={input} value={cfg.testimonials?.subtitle || ""} onChange={(e) => setField("testimonials", "subtitle", e.target.value)} /></Field>
          </div>
          <ListEditor
            items={(cfg.testimonials?.items) || []}
            onChange={(v) => setSection("testimonials", { ...(cfg.testimonials || {}), items: v })}
            newItem={() => ({ quote: "", author: "", company: "" })}
            fields={[
              { key: "quote", label: "Quote", textarea: true },
              { key: "author", label: "Author" },
              { key: "company", label: "Company" },
            ]}
          />
        </>
      )}

      {tab === "policies" && (
        <PoliciesEditor
          policies={cfg.policies || DEFAULT_POLICIES}
          policyKey={policyKey}
          setPolicyKey={setPolicyKey}
          onChange={(v) => setSection("policies", v)}
          onUpload={handleImageUpload}
          uploading={uploading}
        />
      )}

      {tab === "footer" && (
        <div className="bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-5">
          <Field label="Footer Tagline" full><textarea rows={3} className={input} value={cfg.footer?.tagline || ""} onChange={(e) => setField("footer", "tagline", e.target.value)} /></Field>
          <Field label="Since text"><input className={input} value={cfg.footer?.since || ""} onChange={(e) => setField("footer", "since", e.target.value)} /></Field>
        </div>
      )}

      {tab === "social" && (
        <div className="bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-5">
          <Field label="LinkedIn URL"><input className={input} value={cfg.social?.linkedin || ""} onChange={(e) => setField("social", "linkedin", e.target.value)} placeholder="https://linkedin.com/company/..." /></Field>
          <Field label="Facebook URL"><input className={input} value={cfg.social?.facebook || ""} onChange={(e) => setField("social", "facebook", e.target.value)} /></Field>
          <Field label="Twitter / X URL"><input className={input} value={cfg.social?.twitter || ""} onChange={(e) => setField("social", "twitter", e.target.value)} /></Field>
          <Field label="Instagram URL"><input className={input} value={cfg.social?.instagram || ""} onChange={(e) => setField("social", "instagram", e.target.value)} /></Field>
        </div>
      )}
    </div>
  );
}

function PoliciesEditor({ policies, policyKey, setPolicyKey, onChange, onUpload, uploading }) {
  const input = "w-full bg-white border border-slate-200 px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:border-gold-500 rounded-sm";
  const policy = { ...(DEFAULT_POLICIES[policyKey] || {}), ...(policies[policyKey] || {}) };
  const updatePolicy = (patch) => onChange({ ...policies, [policyKey]: { ...policy, ...patch } });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {Object.entries(POLICY_TITLES).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPolicyKey(key)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
              policyKey === key ? "border-gold-500 bg-gold-50 text-gold-600" : "border-slate-200 text-slate-600 hover:border-gold-500 hover:text-gold-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-5">
        <Field label="Hero Subtitle" full>
          <textarea rows={2} className={input} value={policy.subtitle || ""} onChange={(e) => updatePolicy({ subtitle: e.target.value })} />
        </Field>
        <Field label="Intro Copy" full>
          <textarea rows={3} className={input} value={policy.intro || ""} onChange={(e) => updatePolicy({ intro: e.target.value })} />
        </Field>
        <Field label="Last Updated">
          <input className={input} value={policy.lastUpdated || ""} onChange={(e) => updatePolicy({ lastUpdated: e.target.value })} placeholder="21 June 2026" />
        </Field>
        <Field label="Hero Image URL / Upload">
          <div className="space-y-3">
            <input className={input} value={policy.image || ""} onChange={(e) => updatePolicy({ image: e.target.value })} placeholder="https://... or /uploads/image.png" />
            <label className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 px-4 py-2 text-sm text-navy-900 hover:border-gold-500 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0], (url) => updatePolicy({ image: url }))} disabled={uploading} />
              {uploading ? "Uploading image..." : "Upload image file"}
            </label>
          </div>
        </Field>
        {policy.image && (
          <div className="md:col-span-2">
            <img src={resolveAssetUrl(policy.image)} alt="" className="h-40 w-full object-cover border border-slate-200" />
          </div>
        )}
      </div>

      <div>
        <div className="text-overline mb-3">Hero Badges</div>
        <ListEditor
          items={policy.badges || []}
          onChange={(v) => updatePolicy({ badges: v })}
          newItem={() => ({ label: "", sub: "" })}
          fields={[
            { key: "label", label: "Label" },
            { key: "sub", label: "Sub-label" },
          ]}
        />
      </div>

      <div>
        <div className="text-overline mb-3">Policy Sections</div>
        <ListEditor
          items={policy.content || []}
          onChange={(v) => updatePolicy({ content: v })}
          newItem={() => ({ heading: "", text: "" })}
          fields={[
            { key: "heading", label: "Heading" },
            { key: "text", label: "Content", textarea: true, rows: 6 },
          ]}
        />
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-overline block mb-2">{label}</span>
      {children}
    </label>
  );
}

function ListEditor({ items, onChange, newItem, fields, onUpload, uploading }) {
  const input = "w-full bg-white border border-slate-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:border-gold-500";
  const updateItem = (idx, k, v) => {
    const next = items.slice();
    next[idx] = { ...next[idx], [k]: v };
    onChange(next);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, newItem()]);

  const handleUpload = async (idx, file, fieldKey) => {
    if (!file || !onUpload) return;
    try {
      await onUpload(file, (uploadedUrl) => updateItem(idx, fieldKey, uploadedUrl));
    } catch {}
  };

  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx} className="bg-white border border-slate-200 p-5 grid md:grid-cols-2 gap-4 relative">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">#{idx + 1}</span>
            <button onClick={() => remove(idx)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
          {fields.map((f) => (
            <div key={f.key} className={f.textarea || f.multiline_array || f.preview ? "md:col-span-2" : ""}>
              <label className="text-overline block mb-1.5">{f.label}</label>
              {f.textarea ? (
                <textarea rows={f.rows || 2} className={input} value={it[f.key] || ""} onChange={(e) => updateItem(idx, f.key, e.target.value)} />
              ) : f.multiline_array ? (
                <textarea rows={3} className={input} value={(it[f.key] || []).join("\n")} onChange={(e) => updateItem(idx, f.key, e.target.value.split("\n"))} />
              ) : f.type === "number" ? (
                <input type="number" step="0.1" className={input} value={it[f.key] ?? ""} onChange={(e) => updateItem(idx, f.key, parseFloat(e.target.value) || 0)} />
              ) : (
                <>
                  <input className={input} value={it[f.key] || ""} onChange={(e) => updateItem(idx, f.key, e.target.value)} />
                  {f.upload && onUpload && (
                    <label className="mt-2 inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 px-4 py-2 text-sm text-navy-900 hover:border-gold-500 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => handleUpload(idx, e.target.files?.[0], f.key)}
                      />
                      {uploading ? "Uploading image…" : "Upload image file"}
                    </label>
                  )}
                </>
              )}
              {f.preview && it[f.key] && <img src={resolveAssetUrl(it[f.key])} alt="" className="mt-2 h-24 w-full object-cover border border-slate-200" />}
            </div>
          ))}
        </div>
      ))}
      <button onClick={add} className="inline-flex items-center gap-2 border-2 border-dashed border-slate-300 hover:border-gold-500 hover:text-gold-500 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors">
        <Plus size={14} /> Add item
      </button>
    </div>
  );
}
