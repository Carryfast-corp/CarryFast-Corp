import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, ImagePlus, Trash2 } from "lucide-react";
import { createBlogPost, getBlogPost, updateBlogPost, uploadImage } from "@/lib/firebaseData";
import { toast } from "sonner";
import { ADMIN_URL } from "@/lib/firebase";
import { resolveAssetUrl } from "@/lib/assets";
import { useAuth } from "@/contexts/AuthContext";

const empty = {
  title: "", excerpt: "", content: "", cover_image: "", og_image: "",
  custom_slug: "", tags: [], featured: false, meta_title: "", meta_description: "",
  meta_keywords: "", status: "draft",
};

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(null); // 'cover' | 'og'

  useEffect(() => {
    if (!isNew) {
      getBlogPost(id).then((data) => {
        if (data) setForm({ ...empty, ...data, tags: data.tags || [] });
      });
    }
  }, [id, isNew]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const url = await uploadImage(file);
      set(field === "cover" ? "cover_image" : "og_image", url);
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(e?.message || "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const save = async (status) => {
    if (!form.title || !form.excerpt || !form.content) {
      toast.error("Title, excerpt and content are required.");
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      status,
      tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags,
    };
    try {
      if (isNew) {
        await createBlogPost(payload, user?.name || user?.email || "Admin");
        toast.success(`Post ${status === "published" ? "published" : "saved as draft"}.`);
      } else {
        await updateBlogPost(id, payload);
        toast.success("Post updated.");
      }
      navigate(`${ADMIN_URL}/blog`);
    } catch (err) {
      console.error("Blog save failed:", err);
      toast.error(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-white border border-slate-200 px-4 py-3 text-sm text-navy-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-sm";

  return (
    <div className="p-8 lg:p-10 max-w-6xl">
      <Link to={`${ADMIN_URL}/blog`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold-500 mb-6"><ArrowLeft size={14} /> Back to posts</Link>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="font-display font-extrabold text-3xl text-navy-900">{isNew ? "New post" : "Edit post"}</h1>
        <div className="flex gap-2">
          <button onClick={() => save("draft")} disabled={busy} data-testid="blog-save-draft" className="px-5 py-3 text-sm font-semibold border border-slate-300 text-navy-900 hover:bg-slate-100">Save draft</button>
          <button onClick={() => save("published")} disabled={busy} data-testid="blog-publish" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-gold-500 text-white hover:bg-gold-600"><Save size={16} /> Publish</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main fields */}
        <div className="lg:col-span-8 space-y-5">
          <div>
            <label className="text-overline block mb-2">Title</label>
            <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} data-testid="editor-title" placeholder="Post title" />
          </div>
          <div>
            <label className="text-overline block mb-2">Excerpt</label>
            <textarea className={input} rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} data-testid="editor-excerpt" placeholder="Short summary shown on the listing" />
          </div>
          <div>
            <label className="text-overline block mb-2">Content (Markdown supported)</label>
            <textarea className={`${input} font-mono text-sm leading-relaxed`} rows={22} value={form.content} onChange={(e) => set("content", e.target.value)} data-testid="editor-content" placeholder="## Heading\n\nWrite your SEO-optimised content. Use ## for headings, - for bullet lists." />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <SideBlock title="Publish settings">
            <div>
              <label className="text-overline block mb-2">URL Slug</label>
              <input className={input} value={form.custom_slug} onChange={(e) => set("custom_slug", e.target.value)} placeholder="leave blank to auto-generate" data-testid="editor-slug" />
              <div className="mt-1.5 text-[11px] text-slate-500">/blog/{form.custom_slug || "auto-from-title"}</div>
            </div>
            <div>
              <label className="text-overline block mb-2">Tags (comma-separated)</label>
              <input className={input} value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="cbic, dgft, customs" />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="featured"
                type="checkbox"
                checked={!!form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 text-gold-500 border-slate-300 rounded focus:ring-gold-500"
                data-testid="editor-featured"
              />
              <label htmlFor="featured" className="text-sm text-slate-700">Mark as featured article</label>
            </div>
          </SideBlock>

          <SideBlock title="Cover image">
            <ImageField
              value={form.cover_image}
              onChange={(v) => set("cover_image", v)}
              onUpload={(f) => handleUpload("cover", f)}
              uploading={uploading === "cover"}
              testId="cover-image"
            />
          </SideBlock>

          <SideBlock title="SEO · Search">
            <div>
              <label className="text-overline block mb-2">Meta title</label>
              <input className={input} value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} placeholder="55-60 chars" data-testid="editor-meta-title" />
            </div>
            <div>
              <label className="text-overline block mb-2">Meta description</label>
              <textarea className={input} rows={3} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} placeholder="150-160 chars" data-testid="editor-meta-desc" />
            </div>
            <div>
              <label className="text-overline block mb-2">Meta keywords</label>
              <input className={input} value={form.meta_keywords} onChange={(e) => set("meta_keywords", e.target.value)} placeholder="comma-separated" />
            </div>
          </SideBlock>

          <SideBlock title="SEO · Social (Open Graph)">
            <div>
              <label className="text-overline block mb-2">OG Image</label>
              <div className="text-[11px] text-slate-500 mb-2">Used when shared on LinkedIn / Facebook / WhatsApp. Defaults to cover image if empty.</div>
              <ImageField
                value={form.og_image}
                onChange={(v) => set("og_image", v)}
                onUpload={(f) => handleUpload("og", f)}
                uploading={uploading === "og"}
                testId="og-image"
              />
            </div>
          </SideBlock>
        </div>
      </div>
    </div>
  );
}

function SideBlock({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 p-5 space-y-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-900 pb-2 border-b border-slate-100">{title}</div>
      {children}
    </div>
  );
}

function ImageField({ value, onChange, onUpload, uploading, testId }) {
  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group">
          <img src={resolveAssetUrl(value)} alt="" className="w-full h-40 object-cover border border-slate-200" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <label className="block border-2 border-dashed border-slate-300 hover:border-gold-500 hover:bg-slate-50 transition-colors cursor-pointer p-6 text-center" data-testid={`${testId}-upload-zone`}>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} disabled={uploading} data-testid={`${testId}-input`} />
          {uploading ? (
            <div className="text-sm text-slate-500">Uploading…</div>
          ) : (
            <>
              <ImagePlus size={28} className="mx-auto text-slate-400 mb-2" />
              <div className="text-xs font-semibold text-navy-900">Click to upload</div>
              <div className="text-[11px] text-slate-500 mt-1">JPG, PNG, WebP · max 8MB</div>
            </>
          )}
        </label>
      )}
      <div className="text-[11px] text-slate-500">or paste URL</div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-gold-500"
      />
    </div>
  );
}
