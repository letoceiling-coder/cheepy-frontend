import { BlockCategory } from './types';

export interface BlockDefinition {
  type: string;
  label: string;
  category: BlockCategory;
  icon: string; // lucide icon name
  defaultSettings: Record<string, any>;
}

export const blockRegistry: BlockDefinition[] = [
  // Hero
  { type: 'HeroSlider', label: 'Hero Slider', category: 'hero', icon: 'Image', defaultSettings: {} },
  { type: 'CinematicHero', label: 'Cinematic Hero', category: 'hero', icon: 'Film', defaultSettings: {} },
  { type: 'SplitHero', label: 'Split Hero', category: 'hero', icon: 'Columns', defaultSettings: {} },
  { type: 'HeroProductPromo', label: 'Hero Product Promo', category: 'hero', icon: 'Star', defaultSettings: {} },
  { type: 'HeroWithSlider', label: 'Hero with Slider', category: 'hero', icon: 'Layers', defaultSettings: {} },

  // Products
  { type: 'ProductGrid', label: 'Product Grid', category: 'products', icon: 'Grid3x3', defaultSettings: { title: 'Products', initialCount: 6 } },
  { type: 'Bestsellers', label: 'Bestsellers', category: 'products', icon: 'Award', defaultSettings: {} },
  { type: 'TrendingProducts', label: 'Trending Products', category: 'products', icon: 'TrendingUp', defaultSettings: {} },
  { type: 'NewArrivals', label: 'New Arrivals', category: 'products', icon: 'Sparkles', defaultSettings: {} },
  { type: 'TopRatedProducts', label: 'Top Rated', category: 'products', icon: 'Star', defaultSettings: {} },
  { type: 'LimitedEdition', label: 'Limited Edition', category: 'products', icon: 'Clock', defaultSettings: {} },
  { type: 'FeaturedCollection', label: 'Featured Collection', category: 'products', icon: 'BookOpen', defaultSettings: {} },
  { type: 'ProductCollection', label: 'Product Collection', category: 'products', icon: 'Package', defaultSettings: {} },
  { type: 'ProductShowcase', label: 'Product Showcase', category: 'products', icon: 'Eye', defaultSettings: {} },
  { type: 'ProductDiscovery', label: 'Product Discovery', category: 'products', icon: 'Search', defaultSettings: {} },
  { type: 'MinimalProductGrid', label: 'Minimal Grid', category: 'products', icon: 'LayoutGrid', defaultSettings: {} },
  { type: 'ProductHoverGrid', label: 'Hover Grid', category: 'products', icon: 'MousePointer', defaultSettings: {} },
  { type: 'InteractiveProductCards', label: 'Interactive Cards', category: 'products', icon: 'Hand', defaultSettings: {} },
  { type: 'TiltProductCards', label: 'Tilt Cards', category: 'products', icon: 'RotateCw', defaultSettings: {} },
  { type: 'ProductRotationShowcase', label: 'Rotation Showcase', category: 'products', icon: 'RefreshCw', defaultSettings: {} },
  { type: 'ProductDemoCards', label: 'Demo Cards', category: 'products', icon: 'Play', defaultSettings: {} },
  { type: 'LargeProductSlider', label: 'Large Slider', category: 'products', icon: 'Maximize', defaultSettings: {} },
  { type: 'BundleDeals', label: 'Bundle Deals', category: 'products', icon: 'Gift', defaultSettings: {} },
  { type: 'ProductComparison', label: 'Product Comparison', category: 'products', icon: 'GitCompare', defaultSettings: {} },
  { type: 'ProductConfigurator', label: 'Product Configurator', category: 'products', icon: 'Settings', defaultSettings: {} },

  // Deals
  { type: 'HotDeals', label: 'Hot Deals', category: 'products', icon: 'Flame', defaultSettings: {} },
  { type: 'DailyDeals', label: 'Daily Deals', category: 'products', icon: 'Calendar', defaultSettings: {} },
  { type: 'FlashSale', label: 'Flash Sale', category: 'products', icon: 'Zap', defaultSettings: {} },
  { type: 'DealsCountdown', label: 'Deals Countdown', category: 'products', icon: 'Timer', defaultSettings: {} },
  { type: 'SpecialOffers', label: 'Special Offers', category: 'products', icon: 'Tag', defaultSettings: {} },

  // Categories
  { type: 'PopularCategories', label: 'Popular Categories', category: 'categories', icon: 'LayoutGrid', defaultSettings: {} },
  { type: 'FeaturedCategories', label: 'Featured Categories', category: 'categories', icon: 'Star', defaultSettings: {} },
  { type: 'CategorySliderSection', label: 'Category Slider', category: 'categories', icon: 'ChevronRight', defaultSettings: {} },
  { type: 'CategoryCircleSlider', label: 'Circle Slider', category: 'categories', icon: 'Circle', defaultSettings: {} },
  { type: 'CategoryTabs', label: 'Category Tabs', category: 'categories', icon: 'Columns', defaultSettings: {} },
  { type: 'CategoryMosaic', label: 'Category Mosaic', category: 'categories', icon: 'LayoutDashboard', defaultSettings: {} },
  { type: 'CategoriesMosaic', label: 'Categories Mosaic', category: 'categories', icon: 'Grid2x2', defaultSettings: {} },
  { type: 'CategoryBanners', label: 'Category Banners', category: 'categories', icon: 'Image', defaultSettings: {} },
  { type: 'LightCategoryNav', label: 'Light Nav', category: 'categories', icon: 'Menu', defaultSettings: {} },
  { type: 'CompactCategories', label: 'Compact Categories', category: 'categories', icon: 'List', defaultSettings: {} },
  { type: 'IconCategories', label: 'Icon Categories', category: 'categories', icon: 'Shapes', defaultSettings: {} },
  { type: 'GridCategories', label: 'Grid Categories', category: 'categories', icon: 'Grid3x3', defaultSettings: {} },

  // Banners
  { type: 'PromoBanner', label: 'Promo Banner', category: 'banners', icon: 'Megaphone', defaultSettings: {} },
  { type: 'SplitProductBanner', label: 'Split Product', category: 'banners', icon: 'Columns', defaultSettings: {} },
  { type: 'FullWidthPromoBanner', label: 'Full Width Promo', category: 'banners', icon: 'Maximize', defaultSettings: {} },
  { type: 'MultiProductBanner', label: 'Multi Product', category: 'banners', icon: 'LayoutGrid', defaultSettings: {} },
  { type: 'DiscountPromoBanner', label: 'Discount Promo', category: 'banners', icon: 'Percent', defaultSettings: {} },
  { type: 'CategoryCtaBanner', label: 'Category CTA', category: 'banners', icon: 'ArrowRight', defaultSettings: {} },

  // Video
  { type: 'VideoGallery', label: 'Video Gallery', category: 'video', icon: 'Video', defaultSettings: {} },
  { type: 'VideoCampaign', label: 'Video Campaign', category: 'video', icon: 'Film', defaultSettings: {} },
  { type: 'VideoProductCard', label: 'Video Product Card', category: 'video', icon: 'Play', defaultSettings: {} },
  { type: 'MiniVideoGallery', label: 'Mini Video Gallery', category: 'video', icon: 'PlaySquare', defaultSettings: {} },
  { type: 'PromoVideoBanner', label: 'Promo Video', category: 'video', icon: 'Clapperboard', defaultSettings: {} },
  { type: 'VideoHeroBanner', label: 'Video Hero', category: 'video', icon: 'MonitorPlay', defaultSettings: {} },
  { type: 'SplitVideoBanner', label: 'Split Video', category: 'video', icon: 'Columns', defaultSettings: {} },
  { type: 'VideoDemoBanner', label: 'Video Demo', category: 'video', icon: 'Tv', defaultSettings: {} },
  { type: 'VideoCarouselBanner', label: 'Video Carousel', category: 'video', icon: 'GalleryHorizontal', defaultSettings: {} },
  { type: 'CinematicVideoBanner', label: 'Cinematic Video', category: 'video', icon: 'Clapperboard', defaultSettings: {} },
  { type: 'SplitVideoFeature', label: 'Split Video Feature', category: 'video', icon: 'SplitSquareVertical', defaultSettings: {} },
  { type: 'VideoProductStory', label: 'Video Product Story', category: 'video', icon: 'BookOpen', defaultSettings: {} },
  { type: 'LifestyleVideoStrip', label: 'Lifestyle Video Strip', category: 'video', icon: 'Film', defaultSettings: {} },

  // Gallery / Mixed
  { type: 'LifestyleGallery', label: 'Lifestyle Gallery', category: 'gallery', icon: 'Images', defaultSettings: {} },
  { type: 'ShopTheLookGallery', label: 'Shop The Look', category: 'gallery', icon: 'ShoppingBag', defaultSettings: {} },
  { type: 'DiscoveryMixedGrid', label: 'Discovery Grid', category: 'mixed', icon: 'LayoutGrid', defaultSettings: {} },
  { type: 'MediaProductSlider', label: 'Media Slider', category: 'mixed', icon: 'GalleryHorizontal', defaultSettings: {} },
  { type: 'CombinedMediaBanner', label: 'Combined Media', category: 'mixed', icon: 'Layers', defaultSettings: {} },

  // Lookbook
  { type: 'LookbookSlider', label: 'Lookbook Slider', category: 'lookbook', icon: 'BookOpen', defaultSettings: {} },
  { type: 'LookOfTheDay', label: 'Look of the Day', category: 'lookbook', icon: 'Sparkles', defaultSettings: {} },
  { type: 'InteractiveLookbook', label: 'Interactive Lookbook', category: 'lookbook', icon: 'Hand', defaultSettings: {} },
  { type: 'RandomModelShowcase', label: 'Random Model Showcase', category: 'lookbook', icon: 'User', defaultSettings: {} },
  { type: 'TrendingFashionShowcase', label: 'Trending Fashion Showcase', category: 'lookbook', icon: 'Sparkles', defaultSettings: {} },
  { type: 'NewCollectionModels', label: 'New Collection Models', category: 'lookbook', icon: 'Shirt', defaultSettings: {} },

  // Quiz
  { type: 'ProductFinderQuiz', label: 'Product Finder', category: 'quiz', icon: 'HelpCircle', defaultSettings: {} },
  { type: 'DealDiscoveryQuiz', label: 'Deal Discovery', category: 'quiz', icon: 'Search', defaultSettings: {} },
  { type: 'LightningDealQuiz', label: 'Lightning Deal', category: 'quiz', icon: 'Zap', defaultSettings: {} },
  { type: 'StyleMatchQuiz', label: 'Style Match', category: 'quiz', icon: 'Palette', defaultSettings: {} },
  { type: 'GiftFinderQuiz', label: 'Gift Finder', category: 'quiz', icon: 'Gift', defaultSettings: {} },

  // CTA / Info
  { type: 'MarketplaceCta', label: 'Marketplace CTA', category: 'cta', icon: 'ArrowRight', defaultSettings: {} },
  { type: 'NewsletterBlock', label: 'Newsletter', category: 'cta', icon: 'Mail', defaultSettings: {} },
  { type: 'MarketplaceAdvantages', label: 'Advantages', category: 'cta', icon: 'CheckCircle', defaultSettings: {} },
  { type: 'AnimatedStats', label: 'Animated Stats', category: 'cta', icon: 'BarChart', defaultSettings: {} },
  { type: 'FeatureTimeline', label: 'Feature Timeline', category: 'cta', icon: 'GitBranch', defaultSettings: {} },
  { type: 'FaqAccordion', label: 'FAQ Accordion', category: 'text', icon: 'HelpCircle', defaultSettings: {} },
  { type: 'InformBlock', label: 'Info Block', category: 'text', icon: 'Info', defaultSettings: {} },
  { type: 'MapSection', label: 'Map Section', category: 'text', icon: 'MapPin', defaultSettings: {} },

  // Social
  { type: 'SocialFeed', label: 'Social Feed', category: 'social', icon: 'Share2', defaultSettings: {} },
  { type: 'CustomerReviews', label: 'Customer Reviews', category: 'social', icon: 'MessageCircle', defaultSettings: {} },
  { type: 'TestimonialsCarousel', label: 'Testimonials', category: 'social', icon: 'Quote', defaultSettings: {} },
  { type: 'CommunityFavorites', label: 'Community Favorites', category: 'social', icon: 'Heart', defaultSettings: {} },
  { type: 'InfluencerPicks', label: 'Influencer Picks', category: 'social', icon: 'Users', defaultSettings: {} },
  { type: 'SellerSpotlight', label: 'Seller Spotlight', category: 'social', icon: 'Store', defaultSettings: {} },
  { type: 'SellerComparison', label: 'Seller Comparison', category: 'social', icon: 'GitCompare', defaultSettings: {} },
  { type: 'SellersSection', label: 'Sellers Section', category: 'social', icon: 'Store', defaultSettings: {} },
  { type: 'BrandShowcase', label: 'Brand Showcase', category: 'social', icon: 'Award', defaultSettings: {} },
  { type: 'BrandStrip', label: 'Brand Strip', category: 'social', icon: 'Ribbon', defaultSettings: {} },
  { type: 'AiRecommendations', label: 'AI Recommendations', category: 'social', icon: 'Bot', defaultSettings: {} },
  { type: 'RecentlyViewed', label: 'Recently Viewed', category: 'social', icon: 'History', defaultSettings: {} },

  // Navigation
  { type: 'Header', label: 'Header', category: 'navigation', icon: 'Menu', defaultSettings: {} },
  { type: 'Footer', label: 'Footer', category: 'footer', icon: 'PanelBottom', defaultSettings: {} },
];

export const getBlocksByCategory = () => {
  const map: Record<string, BlockDefinition[]> = {};
  for (const block of blockRegistry) {
    if (!map[block.category]) map[block.category] = [];
    map[block.category].push(block);
  }
  return map;
};
