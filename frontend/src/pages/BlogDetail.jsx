import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublishedPostBySlug } from "@/lib/firebaseData";
import SEO from "@/components/SEO";
import { ArrowLeft, ArrowUp, Link2, Check } from "lucide-react";
import { resolveAssetUrl } from "@/lib/assets";

// Minimal markdown-ish renderer for headings, paragraphs, lists, quotes
function renderMarkdown(md = "") {
  const blocks = md.split(/\n\n+/);
  let paraCount = 0;

  return blocks.map((b, i) => {
    const trimmed = b.trim();

    if (trimmed.startsWith("### "))
      return (
        <h3 key={i} className="font-display font-bold text-xl text-navy-900 mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    if (trimmed.startsWith("## "))
      return (
        <h2 key={i} className="font-display font-bold text-2xl text-navy-900 mt-10 mb-4 pb-3 border-b border-slate-200">
          {trimmed.slice(3)}
        </h2>
      );
    if (trimmed.startsWith("# "))
      return (
        <h1 key={i} className="font-display font-bold text-3xl text-navy-900 mt-10 mb-4">
          {trimmed.slice(2)}
        </h1>
      );

    if (trimmed.startsWith("> ")) {
      const quote = trimmed.replace(/^>\s?/gm, "");
      return (
        <blockquote key={i} className="my-8 border-l-[3px] border-brand-orange pl-6 py-1">
          <p className="font-display text-xl md:text-2xl font-semibold text-navy-900 leading-snug">
            {quote}
          </p>
        </blockquote>
      );
    }

    if (/^(- |\* )/m.test(trimmed)) {
      const items = trimmed.split(/\n/).map((l) => l.replace(/^(- |\* )/, ""));
      return (
        <ul key={i} className="list-none pl-0 space-y-3 text-slate-700 my-5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
              <span className="leading-relaxed">{it}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (/^\d+\. /m.test(trimmed)) {
      const items = trimmed.split(/\n/).map((l) => l.replace(/^\d+\.\s*/, ""));
      return (
        <ol key={i} className="my-5 space-y-4">
          {items.map((it, j) => (
            <li key={j} className="flex gap-4">
              <span className="font-display font-bold text-brand-orange shrink-0 tabular-nums">
                {String(j + 1).padStart(2, "0")}
              </span>
              <span className="leading-relaxed text-slate-700 pt-0.5">{it}</span>
            </li>
          ))}
        </ol>
      );
    }

    paraCount += 1;
    const isFirstPara = paraCount === 1;
    return (
      <p
        key={i}
        className={
          isFirstPara
            ? "text-slate-700 leading-relaxed my-4 text-[17px] first-letter:font-display first-letter:text-5xl first-letter:font-extrabold first-letter:text-navy-900 first-letter:mr-2 first-letter:float-left first-letter:leading-[0.8] first-letter:mt-1"
            : "text-slate-700 leading-relaxed my-4 text-[17px]"
        }
      >
        {trimmed}
      </p>
    );
  });
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const articleRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setPost(null);
    setNotFound(false);
    getPublishedPostBySlug(slug)
      .then((data) => {
        if (!alive) return;
        if (!data) setNotFound(true);
        else setPost(data);
      })
      .catch(() => {
        if (alive) setNotFound(true);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? scrolled / total : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [post]);

  function handleCopyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (notFound) {
    return (
      <div className="container-x py-32 text-center">
        <h1 className="font-display font-bold text-3xl text-navy-900">Post not found.</h1>
        <Link to="/blog" className="mt-6 inline-block text-brand-orange font-semibold">
          ← Back to blog
        </Link>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="container-x py-32 flex flex-col items-center gap-4 text-slate-500">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-brand-orange animate-spin" />
        <span>Loading article…</span>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${post.meta_title || post.title} | Carry Fast`}
        description={post.meta_description || post.excerpt}
        keywords={post.meta_keywords || (post.tags || []).join(", ")}
        image={resolveAssetUrl(post.cover_image)}
      />

      {/* thin reading progress bar — kept minimal */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-100">
        <div
          className="h-full bg-brand-orange transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <article ref={articleRef} className="bg-white">
        {/* Compact header — no full-bleed navy slab, no meta row */}
        <header className="border-b border-slate-100">
          <div className="container-x max-w-3xl py-10 md:py-14">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-orange text-xs font-semibold uppercase tracking-wider mb-6 transition-colors"
              data-testid="blog-back"
            >
              <ArrowLeft size={12} /> All insights
            </Link>

            <span className="block text-xs font-bold uppercase tracking-wider text-brand-orange mb-4">
              {(post.tags || [])[0] || "Logistics"}
            </span>

            <h1 className="font-display font-extrabold text-3xl md:text-[2.75rem] tracking-tight leading-[1.1] text-navy-900">
              {post.title}
            </h1>
          </div>
        </header>

        {post.cover_image && (
          <div className="container-x max-w-3xl pt-8 md:pt-10">
            <img
              src={resolveAssetUrl(post.cover_image)}
              alt={post.title}
              className="w-full h-[240px] md:h-[340px] object-cover rounded-2xl shadow-sm"
            />
          </div>
        )}

        {/* Single full-width column — no sidebar, no dead gap in the middle */}
        <div className="container-x max-w-3xl py-12 md:py-16">
          <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-brand-orange pl-5 mb-10 italic">
            {post.excerpt}
          </p>

          {renderMarkdown(post.content)}

          <div className="mt-14 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap gap-2">
              {(post.tags || []).map((t) => (
                <span
                  key={t}
                  className="text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-1.5 text-slate-700 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 text-xs font-semibold text-navy-900 hover:text-brand-orange transition-colors"
              >
                {copied ? <Check size={14} className="text-brand-orange" /> : <Link2 size={14} />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand-orange transition-colors"
              >
                <ArrowUp size={14} />
                Top
              </button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}