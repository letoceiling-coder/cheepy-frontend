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
}
