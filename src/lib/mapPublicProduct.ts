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

  const sizeFromAttr = attrByKeyword(attrs, ["размер", "size"]);
  const colorFromAttr = attrByKeyword(attrs, ["цвет", "color"]);
  const sizes = splitList(full.size_range).length > 0 ? splitList(full.size_range) : splitList(sizeFromAttr);
  const colors = splitList(full.color).length > 0 ? splitList(full.color) : splitList(colorFromAttr);

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
  };
}
