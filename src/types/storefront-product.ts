/**
 * Унифицированная модель товара для корзины, избранного и карточек UI (без привязки к mock-data).
 */
export interface StorefrontProduct {
  id: string | number;
  name: string;
  price: number;
  oldPrice?: number;
  images: string[];
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  description: string;
  colors: string[];
  sizes: string[];
  material: string;
  brand: string;
  attributes?: Array<{ name: string; value: string; type?: string }>;
  /** С донора: варианты цвета с ссылками на карточки (если API отдал). */
  colorVariants?: Array<{ id: string; color: string; thumbnail: string | null; title: string; is_current: boolean }>;
  colorVariantsCount?: number;
  colorVariantThumbnails?: string[];
}
