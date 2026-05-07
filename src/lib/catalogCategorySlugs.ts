import type { Category } from "@/lib/api";

export type PreferredCategoryLike = { id: number; slug?: string };

export function flattenMenuCategories(items: Category[] | undefined): Category[] {
  if (!Array.isArray(items)) return [];
  const out: Category[] = [];
  const stack = [...items];
  while (stack.length) {
    const c = stack.shift()!;
    out.push(c);
    if (Array.isArray(c.children)) stack.unshift(...c.children);
  }
  return out;
}

export function findDescendantCategoryIds(items: Category[], rootIds: number[]): number[] {
  if (!rootIds.length) return [];
  const childrenMap = new Map<number, number[]>();
  for (const c of items) {
    if (c.parent_id != null) {
      const arr = childrenMap.get(c.parent_id) ?? [];
      arr.push(c.id);
      childrenMap.set(c.parent_id, arr);
    }
  }
  const visited = new Set<number>();
  const queue = [...rootIds];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const ch = childrenMap.get(id);
    if (ch) queue.push(...ch);
  }
  return Array.from(visited);
}

export function buildCategorySlugById(flatCats: Category[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const c of flatCats) if (c.slug) m.set(c.id, c.slug);
  return m;
}

export function resolveProductFeedCategorySlugs(params: {
  dataMode: "manual" | "auto";
  flatCats: Category[];
  slugById: Map<number, string>;
  categoryIds: number[];
  includeDescendants: boolean;
  preferredCats: PreferredCategoryLike[];
}): string[] {
  const { dataMode, flatCats, slugById, categoryIds, includeDescendants, preferredCats } = params;

  if (dataMode === "manual") {
    const ids = categoryIds.filter((x) => Number.isFinite(x) && x > 0);
    if (ids.length === 0) return [];
    const targetIds = includeDescendants ? findDescendantCategoryIds(flatCats, ids) : ids;
    const slugs: string[] = [];
    for (const id of targetIds) {
      const s = slugById.get(id);
      if (s && !slugs.includes(s)) slugs.push(s);
    }
    return slugs;
  }

  const slugs: string[] = [];
  for (const c of preferredCats) {
    let slug = c.slug;
    if (!slug) slug = slugById.get(c.id) ?? undefined;
    if (slug && !slugs.includes(slug)) slugs.push(slug);
    if (slugs.length >= 5) break;
  }
  if (slugs.length === 0 && flatCats.length > 0) {
    const cold = flatCats
      .filter((c) => c.parent_id == null && (c.products_count ?? 0) > 0)
      .slice(0, 3)
      .map((c) => c.slug)
      .filter(Boolean) as string[];
    slugs.push(...cold);
  }
  return slugs;
}
