import type { NormalizedProfileSettings } from './settingsProfiles';
/**
 * Настройки блока — произвольный объект: один и тот же block_type на разных страницах
 * может задавать title, categorySlug, dataSource, limits и т.д. (см. blockRegistry defaultSettings + CMS page_blocks.settings).
 */
export type BlockSettings = Record<string, unknown> | NormalizedProfileSettings;

export type HeaderLinkTarget = '_self' | '_blank';

export interface NavLinkItem {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  target?: HeaderLinkTarget;
}

export interface SocialLinkItem {
  id: string;
  network: 'youtube' | 'vk' | 'ok' | 'telegram' | 'custom';
  label: string;
  url: string;
  enabled: boolean;
}

export interface HeaderSettings {
  brandText: string;
  searchPlaceholder: string;
  deliveryCtaText: string;
  sellerCtaText: string;
  wholesaleText: string;
  rulesText: string;
  deliveryText: string;
  supportText: string;
  showTopBar: boolean;
  showMainNav: boolean;
  showSocialLinks: boolean;
  showFavorites: boolean;
  showCart: boolean;
  showAccount: boolean;
  topLinks: NavLinkItem[];
  mainNavLinks: NavLinkItem[];
  socialLinks: SocialLinkItem[];
}

export interface FooterColumnSettings {
  id: string;
  title: string;
  enabled: boolean;
  links: NavLinkItem[];
}

export interface FooterContactSettings {
  city: string;
  phone: string;
  email: string;
}

export interface FooterSettings {
  brandText: string;
  description: string;
  copyrightText: string;
  showContacts: boolean;
  showBottomLegal: boolean;
  contacts: FooterContactSettings;
  columns: FooterColumnSettings[];
  legalLinks: NavLinkItem[];
}

export interface BlockConfig {
  id: string;
  type: string;
  label: string;
  category: BlockCategory;
  settings: BlockSettings;
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
