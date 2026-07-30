import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { deleteAdminProfile, saveAdminProfile, subscribeAdminUsers } from "@/lib/firebaseData";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ uid: "", email: "", name: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeAdminUsers(setUsers, () => {}), []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveAdminProfile(form, me?.email);
      toast.success(`Admin access granted to ${form.email}.`);
      setForm({ uid: "", email: "", name: "" });
      setShowAdd(false);
    } catch (err) {
      toast.error(err?.message || "Could not grant admin access.");
    } finally {
      setBusy(false);
    }
  };

  const del = async (uid, email) => {
    if (!window.confirm(`Revoke admin access for ${email}? Their Firebase login will remain in Firebase Auth.`)) return;
    try {
      await deleteAdminProfile(uid);
      toast.success("Admin access revoked.");
    } catch (err) {
      toast.error(err?.message || "Delete failed.");
    }
  };

  const input = "w-full bg-white border border-slate-200 px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:border-gold-500 rounded-sm";

  return (
    <div className="p-8 lg:p-10 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-overline">Access Control</div>
          <h1 className="font-display font-extrabold text-3xl text-navy-900 mt-1">Admin Users</h1>
          <p className="mt-2 text-sm text-slate-600">Manage admin access for existing Firebase Auth users. Roles update live from Firestore.</p>
        </div>
        <button onClick={() => setShowAdd(true)} data-testid="add-admin-btn" className="inline-flex items-center gap-2 bg-gold-500 text-white px-5 py-3 text-sm font-semibold hover:bg-gold-600">
          <Plus size={16} /> Add admin
        </button>
      </header>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No users yet.</td></tr>
            ) : users.map((u) => (
              <tr key={u.uid} className="border-b border-slate-100" data-testid={`user-row-${u.uid}`}>
                <td className="px-5 py-4 font-medium text-navy-900">{u.name || "—"} {u.uid === me?.uid && <span className="ml-2 text-[10px] uppercase tracking-wider text-gold-500 font-bold">you</span>}</td>
                <td className="px-5 py-4 text-slate-700">{u.email}</td>
                <td className="px-5 py-4"><span className="inline-block px-2.5 py-0.5 text-xs uppercase tracking-wider bg-navy-900 text-white">{u.role}</span></td>
                <td className="px-5 py-4 text-xs text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-4 text-right">
                  {u.uid !== me?.uid && (
                    <button onClick={() => del(u.uid, u.email)} className="text-slate-400 hover:text-red-600" data-testid={`user-delete-${u.uid}`}><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl text-navy-900">Add new admin</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-navy-900"><X size={20} /></button>
            </div>
            <form onSubmit={add} className="space-y-4">
              <div><label className="text-overline block mb-1.5">Firebase UID</label><input required className={input} value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} placeholder="Firebase Auth user UID" data-testid="new-admin-uid" /></div>
              <div><label className="text-overline block mb-1.5">Name</label><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
              <div><label className="text-overline block mb-1.5">Email</label><input type="email" required className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@carryfastcorp.com" data-testid="new-admin-email" /></div>
              <div className="text-[11px] text-slate-500">Create the login in Firebase Console first, then paste that user's UID here to grant admin access.</div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm font-semibold border border-slate-300 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={busy} data-testid="new-admin-submit" className="px-5 py-2.5 text-sm font-bold bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50">{busy ? "Saving…" : "Grant access"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
