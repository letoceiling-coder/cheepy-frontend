/**
 * Унифицированная модель товара для корзины, избранного и карточек UI (без привязки к mock-data).
 */
export interface StorefrontProduct {
  id: number;
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
}
