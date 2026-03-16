export interface BlockConfig {
  id: string;
  type: string;
  label: string;
  category: BlockCategory;
  settings: Record<string, any>;
  hidden?: boolean;
}

export type BlockCategory =
  | 'hero'
  | 'products'
  | 'categories'
  | 'banners'
  | 'video'
  | 'gallery'
  | 'carousel'
  | 'lookbook'
  | 'quiz'
  | 'cta'
  | 'mixed'
  | 'text'
  | 'social'
  | 'navigation'
  | 'footer';

export interface PageTemplate {
  id: string;
  name: string;
  blocks: BlockConfig[];
  createdAt: string;
}

export interface HistoryEntry {
  blocks: BlockConfig[];
  timestamp: number;
}

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  hero: 'Hero Sections',
  products: 'Product Grids',
  categories: 'Category Sections',
  banners: 'Banners',
  video: 'Video Sections',
  gallery: 'Gallery Layouts',
  carousel: 'Carousels',
  lookbook: 'Lookbook',
  quiz: 'Quiz Blocks',
  cta: 'CTA Sections',
  mixed: 'Mixed Media',
  text: 'Text & Info',
  social: 'Social & Reviews',
  navigation: 'Navigation',
  footer: 'Footer',
};
