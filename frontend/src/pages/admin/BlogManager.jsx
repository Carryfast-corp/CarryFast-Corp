import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { deleteBlogPost, subscribeAdminPosts } from "@/lib/firebaseData";
import { toast } from "sonner";
import { ADMIN_URL } from "@/lib/firebase";

export default function BlogManager() {
  const [posts, setPosts] = useState([]);
  useEffect(() => subscribeAdminPosts(setPosts, () => {}), []);

  const del = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    await deleteBlogPost(id);
    toast.success("Post deleted");
  };

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-overline">Content</div>
          <h1 className="font-display font-extrabold text-3xl text-navy-900 mt-1">Blog CMS</h1>
        </div>
        <Link to={`${ADMIN_URL}/blog/new`} data-testid="admin-blog-new" className="inline-flex items-center gap-2 bg-gold-500 text-white px-5 py-3 text-sm font-semibold hover:bg-gold-600">
          <Plus size={16} /> New Post
        </Link>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Featured</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Views</th>
              <th className="px-5 py-3">Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No posts yet. Create your first one.</td></tr>
            ) : posts.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`admin-blog-row-${p.id}`}>
                <td className="px-5 py-4 font-medium text-navy-900">{p.title}<div className="text-xs text-slate-400 font-mono mt-0.5">/blog/{p.slug}</div></td>
                <td className="px-5 py-4 text-slate-600">{p.featured ? "⭐" : "—"}</td>
                <td className="px-5 py-4">
                  <span className={`inline-block px-2.5 py-0.5 text-xs uppercase tracking-wider ${p.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{p.status}</span>
                </td>
                <td className="px-5 py-4 text-slate-600">{p.views || 0}</td>
                <td className="px-5 py-4 text-slate-500 text-xs">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex gap-2">
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-gold-500" title="View"><Eye size={16} /></a>
                    <Link to={`${ADMIN_URL}/blog/${p.id}`} className="p-2 text-slate-500 hover:text-navy-900" data-testid={`admin-blog-edit-${p.id}`} title="Edit"><Edit size={16} /></Link>
                    <button onClick={() => del(p.id)} className="p-2 text-slate-500 hover:text-red-600" data-testid={`admin-blog-delete-${p.id}`} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
