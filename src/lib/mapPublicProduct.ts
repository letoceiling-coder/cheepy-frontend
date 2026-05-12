import type { Product, ProductFull } from "@/lib/api";
import type { StorefrontProduct } from "@/types/storefront-product";

function parseRuPrice(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0;
  const digits = String(raw).replace(/\s/g, "").replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

function splitList(raw: string | null | undefined): string[] {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,;/|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function attrByKeyword(attrs: Array<{ name: string; value: string; type?: string }> | undefined, needles: string[]): string | undefined {
  if (!attrs?.length) return undefined;
  const nl = needles.map((n) => n.toLowerCase());
  for (const a of attrs) {
    const key = (a.name || "").toLowerCase();
    if (nl.some((n) => key.includes(n))) {
      if (a.value != null && String(a.value).trim() !== "") return String(a.value);
    }
  }
  return undefined;
}

function attrsByKeyword(attrs: Array<{ name: string; value: string; type?: string }> | undefined, needles: string[]): string[] {
  if (!attrs?.length) return [];
  const nl = needles.map((n) => n.toLowerCase());
  const values: string[] = [];
  const seen = new Set<string>();

  for (const a of attrs) {
    const key = (a.name || "").toLowerCase();
    if (!nl.some((n) => key.includes(n))) continue;
    const parts = splitList(String(a.value ?? ""));
    for (const part of parts.length > 0 ? parts : [String(a.value ?? "").trim()]) {
      if (!part || seen.has(part)) continue;
      seen.add(part);
      values.push(part);
    }
  }

  return values;
}

/** Совпадение из GET /public/search (storefront-карточка) → Product для списков. */
export function storefrontSearchHitToProduct(hit: StorefrontProductCardPayload): Product {
  const id = hit.id;
  return {
    id,
    external_id: typeof id === "string" ? id : String(id),
    title: hit.title,
    price: hit.price ?? null,
    price_raw: hit.price_raw ?? null,
    status: "active",
    is_relevant: true,
    photos_count: hit.photos_count ?? (hit.thumbnail ? 1 : 0),
    thumbnail: hit.thumbnail ?? null,
    category: hit.category ? { id: 0, name: hit.category.name, slug: hit.category.slug } : null,
    seller: hit.seller ? { id: 0, name: hit.seller.name, slug: hit.seller.slug } : null,
    parsed_at: null,
    color_variants_count: hit.color_variants_count,
    color_variant_thumbnails: hit.color_variant_thumbnails,
  };
}

/** Карточка каталога / списка → модель для ProductCard и корзины. */
export function publicListProductToStorefront(p: Product): StorefrontProduct {
  const price = p.price_raw ?? parseRuPrice(p.price);
  return {
    id: p.id,
    name: p.title,
    price,
    oldPrice: undefined,
    images: p.thumbnail ? [p.thumbnail] : [],
    rating: 0,
    reviews: 0,
    seller: p.seller?.name ?? "",
    category: p.category?.name ?? "",
    description: "",
    colors: [],
    sizes: [],
    material: "",
    brand: "",
    attributes: [],
    colorVariantsCount: typeof p.color_variants_count === "number" ? p.color_variants_count : undefined,
    colorVariantThumbnails:
      Array.isArray(p.color_variant_thumbnails) && p.color_variant_thumbnails.length > 0 ? p.color_variant_thumbnails : undefined,
  };
}

/** Полная карточка товара из Public API → модель витрины. */
export function productFullToStorefront(full: ProductFull): StorefrontProduct {
  const attrs = full.attributes ?? [];
  const images =
    Array.isArray(full.photos) && full.photos.length > 0
      ? full.photos.filter(Boolean)
      : full.thumbnail
        ? [full.thumbnail]
        : [];

  const price = full.price_raw ?? parseRuPrice(full.price);

  const sizes = splitList(full.size_range).length > 0 ? splitList(full.size_range) : attrsByKeyword(attrs, ["размер", "size"]);
  const colorsFromAttrs = splitList(full.color).length > 0 ? splitList(full.color) : attrsByKeyword(attrs, ["цвет", "color"]);
  const apiVariants = full.color_variants;
  const colorVariants =
    apiVariants && apiVariants.length > 0
      ? apiVariants.map((v) => ({
          id: v.id,
          color: v.color,
          thumbnail: v.thumbnail,
          title: v.title,
          is_current: v.is_current,
        }))
      : undefined;
  const colorsFromVariants = colorVariants?.map((v) => v.color).filter(Boolean) ?? [];
  const colors =
    colorsFromVariants.length > 0
      ? [...new Set([...colorsFromVariants, ...colorsFromAttrs])]
      : colorsFromAttrs;

  return {
    id: full.id,
    name: full.title,
    price,
    oldPrice: undefined,
    images,
    rating: 0,
    reviews: 0,
    seller: full.seller?.name ?? "",
    category: full.category?.name ?? "",
    description: full.description ?? "",
    colors,
    sizes,
    material: attrByKeyword(attrs, ["материал", "material"]) ?? "",
    brand: full.brand?.name ?? "",
    attributes: attrs,
    colorVariants,
  };
}
