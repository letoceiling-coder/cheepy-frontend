/** Устаревшие slug из макета/навигации → реальные slug каталога в API. */
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  zhenskoe: "jenskaya-odezhda",
  muzhskoe: "muzhskaya-odezhda",
  odezhda: "jenskaya-odezhda",
};

export function resolveCategorySlug(slug: string | undefined): string | undefined {
  if (!slug) return slug;
  const key = slug.trim().toLowerCase();
  return CATEGORY_SLUG_ALIASES[key] ?? slug;
}

export function normalizeCategoryPath(url: string): string {
  const match = url.match(/^\/category\/([^/?#]+)/i);
  if (!match) return url;
  const resolved = resolveCategorySlug(match[1]);
  return resolved && resolved !== match[1] ? `/category/${resolved}` : url;
}
