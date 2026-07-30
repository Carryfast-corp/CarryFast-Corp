import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, FileText, Eye, AlertCircle, ArrowRight, Users, TrendingUp } from "lucide-react";
import { buildAnalyticsData, subscribeAdminPosts, subscribeLeads } from "@/lib/firebaseData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { ADMIN_URL } from "@/lib/firebase";

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let latestLeads = [];
    let latestPosts = [];
    const publish = () => setData(buildAnalyticsData(latestLeads, latestPosts));
    const unsubLeads = subscribeLeads({}, (leads) => {
      latestLeads = leads;
      publish();
    }, () => {});
    const unsubPosts = subscribeAdminPosts((posts) => {
      latestPosts = posts;
      publish();
    }, () => {});
    return () => {
      unsubLeads?.();
      unsubPosts?.();
    };
  }, []);
  if (!data) return <div className="p-10 text-slate-500">Loading…</div>;
  const k = data.kpis;
  const cards = [
    { label: "Total Leads", value: k.leads_total, sub: `${k.leads_new} new`, icon: Mail, color: "bg-gold-500" },
    { label: "Unread Leads", value: k.leads_unread, sub: "needs attention", icon: AlertCircle, color: "bg-red-500" },
    { label: "Blog Posts", value: k.posts_total, sub: `${k.posts_published} published`, icon: FileText, color: "bg-navy-900" },
    { label: "Blog Views", value: k.blog_views, sub: "all-time", icon: Eye, color: "bg-emerald-600" },
  ];

  return (
    <div className="p-8 lg:p-10 space-y-8">
      <header>
        <div className="text-overline">Overview</div>
        <h1 className="font-display font-extrabold text-3xl text-navy-900 mt-1">Dashboard</h1>
      </header>

      {k.leads_unread > 0 && (
        <Link to={`${ADMIN_URL}/leads`} data-testid="unread-banner" className="block bg-red-50 border border-red-200 p-4 hover:bg-red-100 transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <div>
                <div className="font-semibold">{k.leads_unread} unread {k.leads_unread === 1 ? "lead" : "leads"}</div>
                <div className="text-xs text-red-600/80">Open the leads inbox to review and respond.</div>
              </div>
            </div>
            <ArrowRight size={18} className="text-red-700" />
          </div>
        </Link>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div key={i} data-testid={`kpi-${i}`} className="bg-white border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</div>
                <div className="font-display font-extrabold text-4xl text-navy-900 mt-2">{c.value}</div>
                <div className="text-xs text-slate-500 mt-2">{c.sub}</div>
              </div>
              <div className={`${c.color} w-10 h-10 flex items-center justify-center`}><c.icon size={18} className="text-white" /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-navy-900">Google Analytics</h2>
            <div className="text-sm text-slate-500">GA4 metrics require a server-side reporting bridge.</div>
          </div>
          {!data.ga4 || !data.ga4.metrics || Object.keys(data.ga4.metrics).length === 0 ? (
            <div className="text-xs text-slate-500">GA4 not configured or unavailable</div>
          ) : null}
        </div>
        {data.ga4 && data.ga4.metrics && Object.keys(data.ga4.metrics).length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
              <div className="flex items-center justify-between mb-3 text-slate-500">
                <span className="text-xs uppercase tracking-wider">Active users</span>
                <Users size={18} />
              </div>
              <div className="text-3xl font-bold text-navy-900">{data.ga4.metrics.activeUsers}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
              <div className="flex items-center justify-between mb-3 text-slate-500">
                <span className="text-xs uppercase tracking-wider">New users</span>
                <TrendingUp size={18} />
              </div>
              <div className="text-3xl font-bold text-navy-900">{data.ga4.metrics.newUsers}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
              <div className="flex items-center justify-between mb-3 text-slate-500">
                <span className="text-xs uppercase tracking-wider">Sessions</span>
                <Eye size={18} />
              </div>
              <div className="text-3xl font-bold text-navy-900">{data.ga4.metrics.sessions}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
              <div className="flex items-center justify-between mb-3 text-slate-500">
                <span className="text-xs uppercase tracking-wider">Engaged sessions</span>
                <FileText size={18} />
              </div>
              <div className="text-3xl font-bold text-navy-900">{data.ga4.metrics.engagedSessions}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Google Analytics metrics are not available in frontend-only mode.</div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6">
          <h2 className="font-display font-bold text-lg text-navy-900 mb-4">Leads · last 14 days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#C38D41" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6">
          <h2 className="font-display font-bold text-lg text-navy-900 mb-4">Enquiries by type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.enquiry_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0C2041" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-navy-900">Recent leads</h3>
          <Link to={`${ADMIN_URL}/leads`} className="text-sm text-gold-500 font-semibold hover:underline">View all →</Link>
        </div>
        {data.recent_leads.length === 0 ? <div className="text-sm text-slate-500">No leads yet.</div> : (
          <ul className="divide-y divide-slate-100">
            {data.recent_leads.map((l) => (
              <li key={l.id} className="py-3 flex justify-between items-start gap-3">
                <div>
                  <div className="font-medium text-navy-900 text-sm">{l.name} {!l.read && <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full" />}</div>
                  <div className="text-xs text-slate-500">{l.email} · {l.enquiry_type || "General"}</div>
                </div>
                <div className="text-xs text-slate-400">{new Date(l.created_at).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
