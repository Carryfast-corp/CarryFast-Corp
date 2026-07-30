import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { subscribeSiteConfig } from "@/lib/firebaseData";
import { DEFAULT_POLICIES } from "@/lib/defaultPolicies";

const SiteConfigContext = createContext(null);

const normalizePageHeroes = (pageHeroes = {}) => {
  const next = { ...pageHeroes };
  if (next.expertise?.image?.endsWith("/uploads/LOGISTIC1STimage.png")) {
    next.expertise = { ...next.expertise, image: "/logos/LOGISTIC1STimage.png" };
  }
  return next;
};

const normalizeHeroSlides = (slides = []) => slides.map((slide) => {
  const searchable = [
    slide.overline,
    ...(slide.title_lines || []),
    slide.title_span,
    slide.subtitle,
  ].join(" ");

  if (!/\bAEO\b|Authorised Economic Operator/i.test(searchable)) {
    return slide;
  }

  return {
    ...slide,
    overline: "Customs Expertise · Madhya Pradesh",
    title_lines: ["Customs Clearance", "with Proven Expertise"],
    title_span: "across India.",
    subtitle: "Three decades of customs operations, documentation accuracy, and port-level coordination help importers and exporters move cargo with confidence.",
  };
});

// Fallback used only while the first Firestore snapshot is in-flight.
const FALLBACK = {
  company: {
    name: "Carry Fast Corporation",
    short: "Carry Fast",
    tagline: "Custom Broker · Est. 1995",
    logo_url: "/logos/CFC Logo Only-Photoroom.png",
    logo_url_inverted: "/logos/CFC Logo Reverse (1).png",
  },
  contact: {
    phone_primary: "+91 731 2524079",
    phone_secondary: "+91 731 4006969",
    phone_direct: "+91 9300077025",
    phone_urgent: "+91 9300077018",
    whatsapp_number: "919300077018",
    email: "info@carryfastcorp.com",
    address_line_1: "502, A Block, Corporate House",
    address_line_2: "169 R.N.T. Marg, Indore — 452 001",
    address_line_3: "Madhya Pradesh, India",
    working_hours: "Monday – Saturday · 10:30 AM – 6:30 PM",
    map_query: "22.717449,75.872055",
  },
  stats: [
    { value: 30, suffix: "+", label: "Years of Experience", sub: "Handling customs clearance across changing regulations, port procedures, and trade policy since 1995." },
    { value: 12000, suffix: "+", label: "Containers & Shipments Annually", sub: "High-volume capability across air and sea cargo, covering diverse industries and cargo categories." },
    { value: 99.5, suffix: "%", label: "On-Time Clearance Rate", sub: "Documentation accuracy and procedural knowledge translate directly to clearances that do not get held up." },
  ],
  hero_slides: [
    {
      image: "/logos/LOGISTIC1STimage.png",
      overline: "Customs Clearance · Since 1995",
      title_lines: ["Customs Clearance.", "Backed by 30 Years"],
      title_span: "of Operations.",
      subtitle: "India's import and export procedures are detailed, time-sensitive, and constantly evolving. Carry Fast Corporation has managed this process for Indian businesses since 1995.",
    },
    {
      image: "/logos/Truck2nd slide.webp",
      overline: "Customs Expertise · Madhya Pradesh",
      title_lines: ["Customs Clearance", "with Proven Expertise"],
      title_span: "across India.",
      subtitle: "Three decades of customs operations, documentation accuracy, and port-level coordination help importers and exporters move cargo with confidence.",
    },
    {
      image: "/logos/logistic3.jpg",
      overline: "12,000+ Shipments · 99.5% On-Time",
      title_lines: ["Cargo clears.", "Operations"],
      title_span: "never wait.",
      subtitle: "Bill of Entry filed the same day. Examination handled at the port by our team. Documentation pre-validated before submission. A 99.5% on-time rate maintained year after year.",
    },
    {
      image: "/logos/logistic4.jpg",
      overline: "CONCOR Best Customs Broker · Since 1997",
      title_lines: ["Recognised by CONCOR", "every year"],
      title_span: "since 1997.",
      subtitle: "An unbroken record of recognition across nearly three decades — awarded annually by Container Corporation of India",
    },
  ],
  page_heroes: {
    about: { image: "/logos/aboutus.jpg" },
    expertise: { image: "/logos/LOGISTIC1STimage.png" },
    services: { image: "/logos/contact.png" },
    clients: { image: "/logos/ourclients2.jpg" },
    blog: { image: "/logos/blogs.jpg" },
    contact: { image: "/logos/contact us.jpg" },
  },
  testimonials: {
    heading: "What Our Clients Say",
    subtitle: "Client feedback from importers and exporters who trust Carry Fast for customs clearance and trade compliance.",
    items: [
      { quote: "We have worked with Carry Fast Corporation since last 30 years across imports of machinery and raw material. Their team understands customs requirements thoroughly and consistently delivers timely clearances.", author: "— Bridgestone India", company: "Bridgestone India" },
      { quote: "Carry Fast Corporation has been a dependable Customs broker for our business. Documentation is handled accurately, communication is prompt, and shipment status is always clear.", author: "— LiuGong India", company: "LiuGong India" },
      { quote: "Their knowledge of customs procedures has helped us avoid unnecessary delays on multiple shipments. We value their practical approach and responsiveness.", author: "— HEG Ltd", company: "HEG" },
      { quote: "Professional, responsive, and reliable. Their team has supported our customs clearance requirements efficiently and continues to be a trusted logistics partner.", author: "— Tata International", company: "Tata International" },
      { quote: "The team understands the urgency of commercial cargo. Whenever issues arise, they work quickly to resolve them and keep the clearance process moving.", author: "— Shivani Detergents", company: "Shivani Detergents Pvt Ltd" },
      { quote: "Carry Fast Corporation combines experience with accountability. Their guidance on documentation and compliance has been valuable to our import operations.", author: "— Swara Baby Products", company: "Swara Baby Products Ltd" },
    ],
  },
  footer: { tagline: "", since: "Serving Indian Trade Since 1995" },
  social: {
    linkedin: "https://www.linkedin.com/company/carry-fast-corporation/?lipi=urn%3Ali%3Apage%3Ad_flagship3_search_srp_companies%3BgHgXE7FaReiAT0hBzVzrLQ%3D%3D",
    facebook: "",
    instagram: "",
    twitter: "",
  },
  policies: DEFAULT_POLICIES,
};

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const applyConfig = useCallback((data) => {
    if (data) {
      setConfig({
        ...FALLBACK,
        ...data,
        contact: { ...FALLBACK.contact, ...(data.contact || {}) },
        company: { ...FALLBACK.company, ...(data.company || {}) },
        hero_slides: normalizeHeroSlides(data.hero_slides || FALLBACK.hero_slides),
        page_heroes: normalizePageHeroes({ ...FALLBACK.page_heroes, ...(data.page_heroes || {}) }),
        testimonials: { ...FALLBACK.testimonials, ...(data.testimonials || {}) },
        policies: { ...FALLBACK.policies, ...(data.policies || {}) },
      });
    }
    setLoaded(true);
  }, []);

  const refresh = useCallback(async () => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    try {
      return subscribeSiteConfig(applyConfig, () => setLoaded(true));
    } catch {
      setLoaded(true);
      return undefined;
    }
  }, [applyConfig]);

  return (
    <SiteConfigContext.Provider value={{ config, loaded, refresh }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const ctx = useContext(SiteConfigContext);
  return ctx ? ctx.config : FALLBACK;
};

export const useSiteConfigCtx = () => useContext(SiteConfigContext);
