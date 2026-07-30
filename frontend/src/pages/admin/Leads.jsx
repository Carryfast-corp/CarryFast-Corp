import { useCallback, useEffect, useState } from "react";
import { Trash2, Search, Download, CircleDot } from "lucide-react";
import { deleteLead, leadsToCsv, markAllLeadsRead, subscribeLeads, updateLead } from "@/lib/firebaseData";
import { toast } from "sonner";

const STATUSES = ["new", "contacted", "qualified", "closed"];
const ENQUIRY_TYPES = ["", "Import", "Export", "Trade Compliance", "Documentation", "General"];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [enq, setEnq] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    return subscribeLeads({ q, status, enquiry_type: enq }, setLeads, () => {});
  }, [q, status, enq]);

  useEffect(() => {
    if (leads.length) markAllLeadsRead(leads).catch(() => {});
  }, [leads]);

  const updateStatus = async (id, s) => {
    await updateLead(id, { status: s });
  };
  const del = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    await deleteLead(id);
    toast.success("Deleted");
    if (selected?.id === id) setSelected(null);
  };

  const downloadCsv = async () => {
    try {
      const blob = new Blob([leadsToCsv(leads)], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `carry-fast-leads-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("CSV downloaded.");
    } catch (e) {
      toast.error("Export failed.");
    }
  };

  return (
    <div className="p-8 lg:p-10 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-overline">Inbox</div>
          <h1 className="font-display font-extrabold text-3xl text-navy-900 mt-1">Leads</h1>
        </div>
        <button onClick={downloadCsv} data-testid="export-csv-btn" className="inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-4 grid md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-6 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, company, message…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-gold-500"
            data-testid="leads-search"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="leads-status-filter"
                className="md:col-span-3 px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-gold-500">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={enq} onChange={(e) => setEnq(e.target.value)} data-testid="leads-type-filter"
                className="md:col-span-3 px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-gold-500">
          <option value="">All types</option>
          {ENQUIRY_TYPES.filter(Boolean).map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table + detail panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`bg-white border border-slate-200 overflow-x-auto ${selected ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 w-6"></th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No leads match your filters.</td></tr>
              ) : leads.map((l) => (
                <tr key={l.id} className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selected?.id === l.id ? "bg-amber-50" : ""}`}
                    onClick={() => setSelected(l)} data-testid={`lead-row-${l.id}`}>
                  <td className="px-5 py-4">{!l.read && <CircleDot size={12} className="text-red-500" />}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-navy-900">{l.name}</div>
                    <div className="text-xs text-slate-500">{l.email}</div>
                    {l.company && <div className="text-xs text-slate-400">{l.company}</div>}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{l.enquiry_type || "General"}</td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className="bg-white border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-gold-500">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); del(l.id); }} className="text-slate-400 hover:text-red-600" data-testid={`lead-delete-${l.id}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 self-start" data-testid="lead-detail">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-navy-900">Lead detail</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-navy-900">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><div className="text-overline mb-1">Name</div><div className="text-navy-900">{selected.name}</div></div>
              <div><div className="text-overline mb-1">Email</div><a className="text-navy-900 hover:text-gold-500" href={`mailto:${selected.email}`}>{selected.email}</a></div>
              {selected.phone && <div><div className="text-overline mb-1">Phone</div><a className="text-navy-900 hover:text-gold-500" href={`tel:${selected.phone}`}>{selected.phone}</a></div>}
              {selected.company && <div><div className="text-overline mb-1">Company</div><div className="text-navy-900">{selected.company}</div></div>}
              {selected.designation && <div><div className="text-overline mb-1">Designation</div><div className="text-navy-900">{selected.designation}</div></div>}
              <div><div className="text-overline mb-1">Enquiry Type</div><div className="text-navy-900">{selected.enquiry_type || "General"}</div></div>
              <div><div className="text-overline mb-1">Message</div><div className="text-navy-900 whitespace-pre-line leading-relaxed">{selected.message}</div></div>
              <div><div className="text-overline mb-1">Submitted</div><div className="text-slate-600 text-xs">{new Date(selected.created_at).toLocaleString()}</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
