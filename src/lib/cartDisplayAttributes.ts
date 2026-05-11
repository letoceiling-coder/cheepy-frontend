import type { CartSelectedAttribute } from "@/contexts/CartContext";

/** Имена атрибутов, которые уже показаны отдельными селекторами цвета/размера в корзине и карточке товара. */
const SIZE_ATTR_NAMES = new Set(["размер", "size", "размеры", "sizes"]);
const COLOR_ATTR_NAMES = new Set(["цвет", "color", "colour", "цвет товара", "оттенок"]);

function normAttrName(name: string): string {
  return name.trim().toLowerCase();
}

/** Убирает из списка атрибутов дубликаты опций «размер/цвет», чтобы не рендерить десятки чипов под кнопками. */
export function filterRedundantVariantAttributes(attrs: CartSelectedAttribute[]): CartSelectedAttribute[] {
  return attrs.filter((a) => {
    const n = normAttrName(a.name ?? "");
    if (SIZE_ATTR_NAMES.has(n)) return false;
    if (COLOR_ATTR_NAMES.has(n)) return false;
    return Boolean(a.name?.trim() && a.value?.trim());
  });
}
