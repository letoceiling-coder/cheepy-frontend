/** Сопоставление названий цвета (RU/EN) с hex для круглых свотчей на карточке товара. */
const COLOR_HEX_ENTRIES: Array<{ keys: string[]; hex: string }> = [
  { keys: ["белый", "white", "молочный", "кремовый", "ivory"], hex: "#FFFFFF" },
  { keys: ["синий", "blue", "navy", "индиго", "indigo"], hex: "#2563EB" },
  { keys: ["голубой", "light blue", "sky", "бирюзовый", "cyan", "aqua"], hex: "#38BDF8" },
  { keys: ["фиолетовый", "purple", "violet", "сиреневый", "лиловый", "lavender"], hex: "#7C3AED" },
  { keys: ["красный", "red", "бордовый", "maroon", "wine", "винный"], hex: "#EF4444" },
  { keys: ["розовый", "pink", "rose", "фуксия", "fuchsia"], hex: "#EC4899" },
  { keys: ["зеленый", "зелёный", "green", "оливковый", "olive", "хаки", "khaki"], hex: "#22C55E" },
  { keys: ["желтый", "жёлтый", "yellow", "gold", "золотой"], hex: "#EAB308" },
  { keys: ["оранжевый", "orange", "коралловый", "coral"], hex: "#F97316" },
  { keys: ["коричневый", "brown", "кофейный", "coffee", "шоколадный", "chocolate"], hex: "#92400E" },
  { keys: ["бежевый", "beige", "песочный", "sand", "tan"], hex: "#D4B896" },
  { keys: ["серый", "grey", "gray", "серебристый", "silver"], hex: "#9CA3AF" },
  { keys: ["черный", "чёрный", "black", "угольный", "charcoal"], hex: "#1F2937" },
];

function normalizeColorKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Возвращает hex по названию цвета; при неизвестном — нейтральный серый. */
export function resolveProductColorHex(colorName: string | null | undefined): string {
  const normalized = normalizeColorKey(colorName ?? "");
  if (!normalized) return "#9CA3AF";

  for (const entry of COLOR_HEX_ENTRIES) {
    for (const key of entry.keys) {
      const nk = normalizeColorKey(key);
      if (normalized === nk || normalized.includes(nk) || nk.includes(normalized)) {
        return entry.hex;
      }
    }
  }

  return "#9CA3AF";
}

export function formatColorLabel(colorName: string | null | undefined): string {
  const trimmed = (colorName ?? "").trim();
  return trimmed || "—";
}

/** Светлые свотчи (белый, жёлтый, бежевый) нуждаются в видимой обводке. */
export function isLightColorSwatch(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.82;
}
