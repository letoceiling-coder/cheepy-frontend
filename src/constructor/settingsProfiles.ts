export type SettingsProfileId =
  | 'P-NAV-GLOBAL'
  | 'P-HERO-MEDIA'
  | 'P-PRODUCT-FEED'
  | 'P-CATEGORY-FEED'
  | 'P-BANNER-MEDIA'
  | 'P-VIDEO-MEDIA'
  | 'P-LOOKBOOK-MEDIA'
  | 'P-SOCIAL-FEED'
  | 'P-PAGE-COMPOSED'
  | 'P-UTILITY';

export type DataMode = 'auto' | 'manual' | 'mixed';

export interface LinkItemSetting {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  target?: '_self' | '_blank';
}

export interface CtaSetting {
  text: string;
  url: string;
  target: '_self' | '_blank';
}

export interface ProfileBaseSettings {
  profile: SettingsProfileId;
  dataMode: DataMode;
  title: string;
  subtitle: string;
  visible: boolean;
}

export interface MediaItemSetting {
  id: string;
  mediaFileId: number | null;
  url: string;
  title: string;
  subtitle: string;
  caption: string;
  alt: string;
  cta?: CtaSetting;
}

export interface ProductFeedSettings {
  source: 'system_products';
  statuses: Array<'approved' | 'published'>;
  categoryIds: number[];
  includeDescendants: boolean;
  sortBy: 'created_at' | 'updated_at' | 'price_raw' | 'name' | 'list_position';
  sortDir: 'asc' | 'desc';
  limit: number;
  pinnedProductIds: number[];
  excludedProductIds: number[];
}

export interface CategoryFeedSettings {
  source: 'catalog_categories';
  rootCategoryId: number | null;
  depth: number;
  minProducts: number;
  hideEmpty: boolean;
  sortBy: 'sort_order' | 'name' | 'products_count';
  sortDir: 'asc' | 'desc';
  limit: number;
}

export interface NavGlobalSettings extends ProfileBaseSettings {
  profile: 'P-NAV-GLOBAL';
  links: LinkItemSetting[];
}

export interface HeroMediaSettings extends ProfileBaseSettings {
  profile: 'P-HERO-MEDIA';
  media: MediaItemSetting[];
  overlayOpacity: number;
  cta: CtaSetting;
}

export interface ProductFeedProfileSettings extends ProfileBaseSettings {
  profile: 'P-PRODUCT-FEED';
  feed: ProductFeedSettings;
}

export interface CategoryFeedProfileSettings extends ProfileBaseSettings {
  profile: 'P-CATEGORY-FEED';
  feed: CategoryFeedSettings;
}

export interface BannerMediaSettings extends ProfileBaseSettings {
  profile: 'P-BANNER-MEDIA';
  media: MediaItemSetting[];
  autoplaySeconds: number;
}

export interface VideoMediaSettings extends ProfileBaseSettings {
  profile: 'P-VIDEO-MEDIA';
  media: MediaItemSetting[];
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  showControls: boolean;
}

export interface LookbookMediaSettings extends ProfileBaseSettings {
  profile: 'P-LOOKBOOK-MEDIA';
  media: MediaItemSetting[];
  attachedProductIds: number[];
}

export interface SocialFeedSettings extends ProfileBaseSettings {
  profile: 'P-SOCIAL-FEED';
  source: 'reviews' | 'sellers' | 'brands' | 'recent';
  limit: number;
  sortBy: 'created_at' | 'updated_at' | 'name' | 'rating';
  sortDir: 'asc' | 'desc';
}

export interface PageComposedSettings extends ProfileBaseSettings {
  profile: 'P-PAGE-COMPOSED';
  sections: Array<{ id: string; title: string; enabled: boolean }>;
}

export interface UtilitySettings extends ProfileBaseSettings {
  profile: 'P-UTILITY';
  path: string;
  minHeight: number;
  caption: string;
}

export type NormalizedProfileSettings =
  | NavGlobalSettings
  | HeroMediaSettings
  | ProductFeedProfileSettings
  | CategoryFeedProfileSettings
  | BannerMediaSettings
  | VideoMediaSettings
  | LookbookMediaSettings
  | SocialFeedSettings
  | PageComposedSettings
  | UtilitySettings;

const heroTypes = new Set(['HeroSlider', 'CinematicHero', 'SplitHero', 'HeroProductPromo', 'HeroWithSlider']);
const productFeedTypes = new Set([
  'ProductGrid', 'Bestsellers', 'TrendingProducts', 'NewArrivals', 'TopRatedProducts', 'LimitedEdition', 'FeaturedCollection',
  'ProductCollection', 'ProductShowcase', 'ProductDiscovery', 'MinimalProductGrid', 'ProductHoverGrid', 'InteractiveProductCards',
  'TiltProductCards', 'ProductRotationShowcase', 'ProductDemoCards', 'LargeProductSlider', 'BundleDeals', 'ProductComparison',
  'ProductConfigurator', 'HotDeals', 'DailyDeals', 'FlashSale', 'DealsCountdown', 'SpecialOffers', 'ProductDetailHero',
  'ProductRecentlyViewedSection', 'ProductBuyTogetherSection', 'ProductSimilarProductsSection', 'CategoryListingContent', 'FavoritesPageContent',
]);
const categoryFeedTypes = new Set([
  'PopularCategories', 'FeaturedCategories', 'CategorySliderSection', 'CategoryCircleSlider', 'CategoryTabs', 'CategoryMosaic',
  'CategoriesMosaic', 'CategoryBanners', 'LightCategoryNav', 'CompactCategories', 'IconCategories', 'GridCategories',
  'BrandsListPopularSection', 'BrandsListAllSection',
]);
const bannerTypes = new Set(['PromoBanner', 'SplitProductBanner', 'FullWidthPromoBanner', 'MultiProductBanner', 'DiscountPromoBanner', 'CategoryCtaBanner']);
const videoTypes = new Set([
  'VideoGallery', 'VideoCampaign', 'VideoProductCard', 'MiniVideoGallery', 'PromoVideoBanner', 'VideoHeroBanner', 'SplitVideoBanner',
  'VideoDemoBanner', 'VideoCarouselBanner', 'CinematicVideoBanner', 'SplitVideoFeature', 'VideoProductStory', 'LifestyleVideoStrip',
]);
const lookbookTypes = new Set([
  'LifestyleGallery', 'ShopTheLookGallery', 'DiscoveryMixedGrid', 'MediaProductSlider', 'CombinedMediaBanner', 'LookbookSlider',
  'LookOfTheDay', 'InteractiveLookbook', 'RandomModelShowcase', 'TrendingFashionShowcase', 'NewCollectionModels',
]);
const socialTypes = new Set([
  'SocialFeed', 'CustomerReviews', 'TestimonialsCarousel', 'CommunityFavorites', 'InfluencerPicks', 'SellerSpotlight',
  'SellerComparison', 'SellersSection', 'BrandShowcase', 'BrandStrip', 'AiRecommendations', 'RecentlyViewed',
]);
const pageComposedTypes = new Set([
  'ProductPageBreadcrumbs', 'ProductDetailTabsSection', 'ProductSellerCardSection', 'CategoryPageBreadcrumbs', 'CategoryHeroBanner',
  'CartPageContent', 'AuthPageContent', 'BrandsListBreadcrumbs', 'BrandsListHero', 'BrandsListInfoSection',
]);
const utilityTypes = new Set([
  'LivePageEmbed', 'ProductFinderQuiz', 'DealDiscoveryQuiz', 'LightningDealQuiz', 'StyleMatchQuiz', 'GiftFinderQuiz',
  'MarketplaceCta', 'NewsletterBlock', 'MarketplaceAdvantages', 'AnimatedStats', 'FeatureTimeline', 'FaqAccordion', 'InformBlock', 'MapSection',
]);
const navGlobalTypes = new Set(['Header', 'Footer', 'MobileBottomNav']);

export function getSettingsProfileForBlockType(blockType: string): SettingsProfileId {
  if (navGlobalTypes.has(blockType)) return 'P-NAV-GLOBAL';
  if (heroTypes.has(blockType)) return 'P-HERO-MEDIA';
  if (productFeedTypes.has(blockType)) return 'P-PRODUCT-FEED';
  if (categoryFeedTypes.has(blockType)) return 'P-CATEGORY-FEED';
  if (bannerTypes.has(blockType)) return 'P-BANNER-MEDIA';
  if (videoTypes.has(blockType)) return 'P-VIDEO-MEDIA';
  if (lookbookTypes.has(blockType)) return 'P-LOOKBOOK-MEDIA';
  if (socialTypes.has(blockType)) return 'P-SOCIAL-FEED';
  if (pageComposedTypes.has(blockType)) return 'P-PAGE-COMPOSED';
  if (utilityTypes.has(blockType)) return 'P-UTILITY';
  return 'P-UTILITY';
}

function defaultCta(): CtaSetting {
  return { text: '', url: '', target: '_self' };
}

function defaultMediaItem(): MediaItemSetting {
  return { id: `media-${Math.random().toString(36).slice(2, 9)}`, mediaFileId: null, url: '', title: '', subtitle: '', caption: '', alt: '' };
}

function defaultBase(profile: SettingsProfileId): ProfileBaseSettings {
  return { profile, dataMode: 'mixed', title: '', subtitle: '', visible: true };
}

function defaultByProfile(profile: SettingsProfileId): NormalizedProfileSettings {
  const base = defaultBase(profile);
  switch (profile) {
    case 'P-NAV-GLOBAL':
      return { ...base, profile, links: [] };
    case 'P-HERO-MEDIA':
      return { ...base, profile, media: [defaultMediaItem()], overlayOpacity: 30, cta: defaultCta() };
    case 'P-PRODUCT-FEED':
      return {
        ...base, profile, feed: {
          source: 'system_products', statuses: ['approved', 'published'], categoryIds: [], includeDescendants: true,
          sortBy: 'created_at', sortDir: 'desc', limit: 12, pinnedProductIds: [], excludedProductIds: [],
        },
      };
    case 'P-CATEGORY-FEED':
      return {
        ...base, profile, feed: {
          source: 'catalog_categories', rootCategoryId: null, depth: 3, minProducts: 1, hideEmpty: true,
          sortBy: 'sort_order', sortDir: 'asc', limit: 24,
        },
      };
    case 'P-BANNER-MEDIA':
      return { ...base, profile, media: [defaultMediaItem()], autoplaySeconds: 5 };
    case 'P-VIDEO-MEDIA':
      return { ...base, profile, media: [defaultMediaItem()], autoplay: false, muted: true, loop: true, showControls: true };
    case 'P-LOOKBOOK-MEDIA':
      return { ...base, profile, media: [defaultMediaItem()], attachedProductIds: [] };
    case 'P-SOCIAL-FEED':
      return { ...base, profile, source: 'reviews', limit: 8, sortBy: 'created_at', sortDir: 'desc' };
    case 'P-PAGE-COMPOSED':
      return { ...base, profile, sections: [] };
    case 'P-UTILITY':
      return { ...base, profile, path: '/', minHeight: 720, caption: '' };
  }
}

export function normalizeBlockProfileSettings(blockType: string, raw: Record<string, unknown> | undefined | null): NormalizedProfileSettings {
  const profile = getSettingsProfileForBlockType(blockType);
  const defaults = defaultByProfile(profile);
  const safeRaw = raw && typeof raw === 'object' ? raw : {};
  const merged = { ...defaults, ...safeRaw } as NormalizedProfileSettings;
  merged.profile = profile;
  if (merged.profile === 'P-PRODUCT-FEED' && typeof merged.feed?.limit !== 'number') merged.feed.limit = 12;
  if (merged.profile === 'P-CATEGORY-FEED' && typeof merged.feed?.depth !== 'number') merged.feed.depth = 3;
  if ((merged.profile === 'P-HERO-MEDIA' || merged.profile === 'P-BANNER-MEDIA' || merged.profile === 'P-VIDEO-MEDIA' || merged.profile === 'P-LOOKBOOK-MEDIA')
    && (!Array.isArray(merged.media) || merged.media.length === 0)) {
    merged.media = [defaultMediaItem()];
  }
  return merged;
}
