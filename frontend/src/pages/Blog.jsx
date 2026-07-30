import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, BookOpen, TrendingUp } from "lucide-react";
import { subscribePublishedPosts } from "@/lib/firebaseData";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { resolveAssetUrl } from "@/lib/assets";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const CATEGORIES = [
  {
    icon: FileText,
    head: "Customs Notifications",
    intro: "Direct coverage of official notifications and circulars from India's customs and trade regulatory authorities. We summarise what each notification means in practice for importers and exporters.",
    items: [
      { t: "CBIC Updates", d: "Notifications and circulars from the Central Board of Indirect Taxes and Customs — covering tariff changes, duty amendments, customs procedure updates, and policy clarifications that affect clearance operations." },
      { t: "DGFT Notifications", d: "Updates from the Directorate General of Foreign Trade on import and export policy, licensing conditions, ITC(HSN) code amendments, and Foreign Trade Policy circulars with direct operational implications." },
      { t: "ICEGATE Updates", d: "System-level changes, filing procedure updates, and technical notices from ICEGATE — India's customs electronic data interchange platform — that affect how documents are submitted and processed." },
      { t: "Customs Public Notices", d: "Port-level public notices from major customs formations across India — covering examination procedures, facility changes, assessment instructions, and local compliance requirements at specific ports and airports." },
    ],
  },
  {
    icon: BookOpen,
    head: "Trade Insights",
    intro: "Practical guidance on customs procedures, documentation requirements, and compliance topics for import and export operations. Written for operations teams, not lawyers.",
    items: [
      { t: "Customs Procedures", d: "Step-by-step coverage of key customs processes — Bill of Entry filing, risk management system assessment, examination procedures, duty payment mechanisms, and the out-of-charge process across sea, air, and ICD-based clearances." },
      { t: "Documentation Guides", d: "Practical guides to the documents required for specific import and export situations — country-of-origin declarations, end-use bonds, SVB declarations, advance authorisation compliance documentation, MOOWR scheme compliances, and EPCG discharge procedures." },
      { t: "Import & Export Compliance", d: "Analysis of compliance requirements for specific product categories — BIS-notified items, FSSAI-regulated food imports, chemicals under the Hazardous Chemicals Rules, restricted items under ITC(HSN), and anti-dumping duty applicability." },
      { t: "Industry Best Practices", d: "Observations from 30 years of clearance work — how to reduce examination frequency, avoid classification disputes, manage valuation for related-party imports, and structure documentation for repeat import programmes." },
    ],
  },
  {
    icon: TrendingUp,
    head: "Industry Updates",
    intro: "Regulatory changes, trade policy developments, and market conditions that affect importers and exporters in the industries we serve.",
    items: [
      { t: "Regulatory Changes", d: "Coverage of new BIS notifications, revised anti-dumping duty orders, changes to import licensing conditions, and amendments to the Customs Tariff that affect specific industries or cargo categories." },
      { t: "Trade Policy Developments", d: "Analysis of Foreign Trade Policy amendments, new Free Trade Agreement provisions, changes to export incentive schemes, and DGFT policy shifts that affect import-export planning and cost structures." },
      { t: "Logistics & Customs News", d: "Operational updates from India's port and customs ecosystem — congestion advisories, new CFS or ICD facilities, changes to CHA examination procedures, and developments at major ports including JNPA, Mundra, Chennai, and Vizag." },
      { t: "Market Developments Affecting Importers & Exporters", d: "Coverage of trade-related developments that change the import or export environment for specific industries — new safeguard investigations, exchange rate policy, changes to import duty structures on capital goods, and sector-specific trade conditions." },
    ],
  },
];

export default function Blog() {
  const cfg = useSiteConfig();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroImage = cfg.page_heroes?.blog?.image || "/logos/blogs.jpg";

  useEffect(() => {
    try {
      return subscribePublishedPosts(
        (data) => {
          setPosts(data);
          setLoading(false);
        },
        () => setLoading(false),
      );
    } catch {
      setLoading(false);
      return undefined;
    }
  }, []);

  const featured = posts.find((post) => post.featured) || posts[0];
  const recentPosts = featured ? posts.filter((post) => post.id !== featured.id) : posts;

  return (
    <>
      <SEO
        title="Customs & Trade Intelligence | Blog — Carry Fast Corporation"
        description="CBIC notifications, DGFT updates, ICEGATE changes and practical customs guidance for Indian importers and exporters. Trade insights from 30 years of clearance experience."
        keywords="CBIC notifications, DGFT updates, ICEGATE updates, customs procedures India, BIS compliance blog, anti-dumping duty India, customs broker insights"
      />

      <PageHero
        label="Blog"
        title={<>Carry Fast Corporation <span className="text-gold-500">Blog.</span></>}
        subtitle="Indian customs regulations, trade policy and import-export procedures change frequently. We track notifications from CBIC, DGFT and ICEGATE — and translate them into practical operational guidance for importers, exporters and supply chain teams."
        image={heroImage}
        breadcrumbs={[{ to: "/", label: "Home" }, { label: "Blog" }]}
      />

      {/* Featured Article */}
      {featured && (
        <section className="section-y bg-white">
          <div className="container-x">
            <div className="text-overline mb-8">Featured Article</div>
            <Link to={`/blog/${featured.slug}`} data-testid="featured-article" className="block group">
              <div className="grid md:grid-cols-12 gap-10 items-center">
                {featured.cover_image && (
                  <div className="md:col-span-7 h-[420px] overflow-hidden">
                    <img src={resolveAssetUrl(featured.cover_image)} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
                <div className="md:col-span-5">
                  <div className="text-overline mb-4">{(featured.tags || [])[0] || "Insight"}</div>
                  <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight leading-tight text-navy-900 group-hover:text-gold-500 transition-colors">{featured.title}</h2>
                  <p className="mt-5 text-slate-600 leading-relaxed">{featured.excerpt}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 group-hover:text-gold-500">Read article <ArrowRight size={14} /></div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Recent Articles Grid */}
      <section className="section-y bg-slate-50">
        <div className="container-x">
          <div className="mb-10">
            <div className="text-overline mb-5">Latest Articles</div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight text-navy-900">Latest from the Carry Fast blog.</h2>
          </div>
          {loading ? (
            <div className="text-slate-500 py-12">Loading…</div>
          ) : recentPosts.length === 0 ? (
            <div className="text-slate-500 py-12 border border-dashed border-slate-300 text-center">More articles coming soon. Check back regularly.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`} className="group block bg-white border border-slate-200 hover:border-gold-500 hover:shadow-lg transition-all">
                  {p.cover_image && (
                    <div className="h-52 overflow-hidden bg-slate-100">
                      <img src={resolveAssetUrl(p.cover_image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-overline mb-3">{(p.tags || [])[0] || "Insight"}</div>
                    <h3 className="font-display font-semibold text-xl text-navy-900 group-hover:text-gold-500 transition-colors leading-snug">{p.title}</h3>
                    <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">{p.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="section-y bg-white">
        <div className="container-x">
          <div className="mb-12">
            <div className="text-overline mb-5">Topics We Cover</div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight text-navy-900">Three Categories. One Source.</h2>
          </div>
          <div className="space-y-12">
            {CATEGORIES.map((cat, i) => (
              <div key={i} data-testid={`category-${i}`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-navy-900 flex items-center justify-center"><cat.icon size={22} className="text-gold-500" strokeWidth={1.6} /></div>
                  <h3 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-navy-900">{cat.head}</h3>
                </div>
                <p className="text-slate-600 mb-6 max-w-3xl leading-relaxed">{cat.intro}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {cat.items.map((it, j) => (
                    <div key={j} className="bg-white border border-slate-200 p-6 hover:border-gold-500 transition-colors">
                      <h4 className="font-display font-semibold text-base text-navy-900 leading-snug">{it.t}</h4>
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed">{it.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
