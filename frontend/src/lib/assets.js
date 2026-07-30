const ABSOLUTE_URL_RE = /^(?:https?:)?\/\//i;
const LOGO_VARIANT_RE = /-(?:lg|md|sm)$/i;

export function resolveAssetUrl(url) {
  if (!url || typeof url !== "string") return url;

  let value = url.trim();
  if (value.endsWith("/uploads/LOGISTIC1STimage.png")) {
    value = "/logos/LOGISTIC1STimage.png";
  }

  if (!value || ABSOLUTE_URL_RE.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return value;
  }

  const uploadsIndex = value.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return value.slice(uploadsIndex);
  }

  return value;
}

export function getOptimizedLogoAsset(url) {
  if (!url || typeof url !== "string") return null;

  const value = url.trim();
  if (!value.startsWith("/logos/")) return null;

  const baseWithoutExt = value.replace(/\.[^/.]+$/, "");
  return {
    base: baseWithoutExt.replace(LOGO_VARIANT_RE, ""),
    src: value,
  };
}
