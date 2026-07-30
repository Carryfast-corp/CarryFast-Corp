import { useState } from "react";
import { toast } from "sonner";
import { createLead } from "@/lib/firebaseData";

const ENQUIRY_TYPES = ["Import", "Export", "Trade Compliance", "Documentation", "General"];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "", company: "", designation: "", phone: "", email: "",
    enquiry_type: ENQUIRY_TYPES[0], message: "", source: "contact",
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Name, email and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        source: "contact",
        enquiry_type: form.enquiry_type,
        message: `Designation: ${form.designation || "—"}\nEnquiry Type: ${form.enquiry_type}\n\n${form.message}`,
      };
      await createLead(payload);
      toast.success("Thank you. Our team will respond within one business day.");
      setForm({ name: "", company: "", designation: "", phone: "", email: "", enquiry_type: ENQUIRY_TYPES[0], message: "", source: "contact" });
      if (window.gtag) window.gtag("event", "generate_lead", { event_category: "contact" });
      if (window.fbq) window.fbq("track", "Lead");
    } catch (err) {
      console.error("Lead submission failed:", err);
      toast.error(err?.message || "Submission failed. Please call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const input = "w-full bg-white border border-slate-200 px-4 py-3 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors rounded-sm";

  return (
    <form onSubmit={onSubmit} data-testid="contact-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input className={input} placeholder="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="contact-name" />
      <input className={input} placeholder="Company name" value={form.company} onChange={(e) => set("company", e.target.value)} data-testid="contact-company" />
      <input className={input} placeholder="Designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} data-testid="contact-designation" />
      <input className={input} placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} data-testid="contact-phone" />
      <input className={input} placeholder="Email address *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} data-testid="contact-email" />
      <select className={input} value={form.enquiry_type} onChange={(e) => set("enquiry_type", e.target.value)} data-testid="contact-enquiry-type">
        {ENQUIRY_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <textarea className={`${input} md:col-span-2`} rows={5} placeholder="How can we help? *" value={form.message} onChange={(e) => set("message", e.target.value)} data-testid="contact-message" />
      <button
        type="submit"
        disabled={submitting}
        data-testid="contact-submit-btn"
        className="md:col-span-2 inline-flex items-center justify-center gap-2 bg-gold-500 text-white px-7 py-4 text-sm font-semibold hover:bg-gold-600 transition-colors disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Submit Enquiry →"}
      </button>
    </form>
  );
}
