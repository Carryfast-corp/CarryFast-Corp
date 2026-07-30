import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Mail, Settings, Users, LogOut, ExternalLink, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { ADMIN_URL } from "@/lib/firebase";
import { subscribeUnreadLeadCount } from "@/lib/firebaseData";

const NAV = [
  { to: "", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "blog", icon: FileText, label: "Blog CMS" },
  { to: "leads", icon: Mail, label: "Leads" },
  { to: "site-config", icon: Settings, label: "Site Content" },
  { to: "users", icon: Users, label: "Admin Users" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    return subscribeUnreadLeadCount(setUnread, () => {});
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-navy-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10"><Logo inverted /></div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to || "root"}
              to={n.to ? `${ADMIN_URL}/${n.to}` : ADMIN_URL}
              end={n.end}
              data-testid={`admin-nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative ${isActive ? "bg-gold-500 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`
              }
            >
              <n.icon size={18} strokeWidth={1.8} />
              {n.label}
              {n.to === "leads" && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unread > 99 ? "99+" : unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white/60 hover:text-gold-400">
            <ExternalLink size={14} /> View site
          </a>
          <div className="text-xs text-white/40">Signed in as<br /><span className="text-white/80">{user?.email}</span></div>
          <button onClick={async () => { await logout(); navigate(`${ADMIN_URL}/login`); }} data-testid="admin-logout" className="w-full flex items-center justify-center gap-2 border border-white/20 text-white px-3 py-2 text-xs font-semibold hover:bg-white/10">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
