import React, { lazy, Suspense } from 'react';
import { BlockConfig } from './types';

// Lazy load all section components
const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  HeroSlider: lazy(() => import('@/components/HeroSlider')),
  CinematicHero: lazy(() => import('@/components/sections/CinematicHero')),
  SplitHero: lazy(() => import('@/components/sections/SplitHero')),
  HeroProductPromo: lazy(() => import('@/components/sections/HeroProductPromo')),
  HeroWithSlider: lazy(() => import('@/components/sections/HeroWithSlider')),
  ProductGrid: lazy(() => import('@/components/ProductGrid')),
  Bestsellers: lazy(() => import('@/components/sections/Bestsellers')),
  TrendingProducts: lazy(() => import('@/components/sections/TrendingProducts')),
  NewArrivals: lazy(() => import('@/components/sections/NewArrivals')),
  TopRatedProducts: lazy(() => import('@/components/sections/TopRatedProducts')),
  LimitedEdition: lazy(() => import('@/components/sections/LimitedEdition')),
  FeaturedCollection: lazy(() => import('@/components/sections/FeaturedCollection')),
  ProductCollection: lazy(() => import('@/components/sections/ProductCollection')),
  ProductShowcase: lazy(() => import('@/components/sections/ProductShowcase')),
  ProductDiscovery: lazy(() => import('@/components/sections/ProductDiscovery')),
  MinimalProductGrid: lazy(() => import('@/components/sections/MinimalProductGrid')),
  ProductHoverGrid: lazy(() => import('@/components/sections/ProductHoverGrid')),
  InteractiveProductCards: lazy(() => import('@/components/sections/InteractiveProductCards')),
  TiltProductCards: lazy(() => import('@/components/sections/TiltProductCards')),
  ProductRotationShowcase: lazy(() => import('@/components/sections/ProductRotationShowcase')),
  ProductDemoCards: lazy(() => import('@/components/sections/ProductDemoCards')),
  LargeProductSlider: lazy(() => import('@/components/sections/LargeProductSlider')),
  BundleDeals: lazy(() => import('@/components/sections/BundleDeals')),
  ProductComparison: lazy(() => import('@/components/sections/ProductComparison')),
  ProductConfigurator: lazy(() => import('@/components/sections/ProductConfigurator')),
  HotDeals: lazy(() => import('@/components/sections/HotDeals')),
  DailyDeals: lazy(() => import('@/components/sections/DailyDeals')),
  FlashSale: lazy(() => import('@/components/sections/FlashSale')),
  DealsCountdown: lazy(() => import('@/components/sections/DealsCountdown')),
  SpecialOffers: lazy(() => import('@/components/sections/SpecialOffers')),
  PopularCategories: lazy(() => import('@/components/sections/PopularCategories')),
  FeaturedCategories: lazy(() => import('@/components/sections/FeaturedCategories')),
  CategorySliderSection: lazy(() => import('@/components/home/CategorySliderSection')),
  CategoryCircleSlider: lazy(() => import('@/components/sections/CategoryCircleSlider')),
  CategoryTabs: lazy(() => import('@/components/sections/CategoryTabs')),
  CategoryMosaic: lazy(() => import('@/components/sections/CategoryMosaic')),
  CategoriesMosaic: lazy(() => import('@/components/sections/CategoriesMosaic')),
  CategoryBanners: lazy(() => import('@/components/CategoryBanners')),
  LightCategoryNav: lazy(() => import('@/components/home/LightCategoryNav')),
  CompactCategories: lazy(() => import('@/components/home/CategoryVariants/CompactCategories')),
  IconCategories: lazy(() => import('@/components/home/CategoryVariants/IconCategories')),
  GridCategories: lazy(() => import('@/components/home/CategoryVariants/GridCategories')),
  PromoBanner: lazy(() => import('@/components/sections/PromoBanner')),
  SplitProductBanner: lazy(() => import('@/components/banners/SplitProductBanner')),
  FullWidthPromoBanner: lazy(() => import('@/components/banners/FullWidthPromoBanner')),
  MultiProductBanner: lazy(() => import('@/components/banners/MultiProductBanner')),
  DiscountPromoBanner: lazy(() => import('@/components/banners/DiscountPromoBanner')),
  CategoryCtaBanner: lazy(() => import('@/components/banners/CategoryCtaBanner')),
  VideoGallery: lazy(() => import('@/components/sections/VideoGallery')),
  VideoCampaign: lazy(() => import('@/components/sections/VideoCampaign')),
  VideoProductCard: lazy(() => import('@/components/sections/VideoProductCard')),
  MiniVideoGallery: lazy(() => import('@/components/sections/MiniVideoGallery')),
  PromoVideoBanner: lazy(() => import('@/components/sections/PromoVideoBanner')),
  VideoHeroBanner: lazy(() => import('@/components/banners/VideoHeroBanner')),
  SplitVideoBanner: lazy(() => import('@/components/banners/SplitVideoBanner')),
  VideoDemoBanner: lazy(() => import('@/components/banners/VideoDemoBanner')),
  VideoCarouselBanner: lazy(() => import('@/components/banners/VideoCarouselBanner')),
  CinematicVideoBanner: lazy(() => import('@/components/banners/CinematicVideoBanner')),
  SplitVideoFeature: lazy(() => import('@/components/sections/SplitVideoFeature')),
  VideoProductStory: lazy(() => import('@/components/sections/VideoProductStory')),
  LifestyleVideoStrip: lazy(() => import('@/components/sections/LifestyleVideoStrip')),
  LifestyleGallery: lazy(() => import('@/components/sections/LifestyleGallery')),
  ShopTheLookGallery: lazy(() => import('@/components/sections/ShopTheLookGallery')),
  DiscoveryMixedGrid: lazy(() => import('@/components/sections/DiscoveryMixedGrid')),
  MediaProductSlider: lazy(() => import('@/components/sections/MediaProductSlider')),
  CombinedMediaBanner: lazy(() => import('@/components/sections/CombinedMediaBanner')),
  LookbookSlider: lazy(() => import('@/components/sections/LookbookSlider')),
  LookOfTheDay: lazy(() => import('@/components/LookOfTheDay')),
  InteractiveLookbook: lazy(() => import('@/components/sections/InteractiveLookbook')),
  ProductFinderQuiz: lazy(() => import('@/components/sections/ProductFinderQuiz')),
  DealDiscoveryQuiz: lazy(() => import('@/components/sections/DealDiscoveryQuiz')),
  LightningDealQuiz: lazy(() => import('@/components/sections/LightningDealQuiz')),
  StyleMatchQuiz: lazy(() => import('@/components/sections/StyleMatchQuiz')),
  GiftFinderQuiz: lazy(() => import('@/components/sections/GiftFinderQuiz')),
  MarketplaceCta: lazy(() => import('@/components/sections/MarketplaceCta')),
  NewsletterBlock: lazy(() => import('@/components/sections/NewsletterBlock')),
  MarketplaceAdvantages: lazy(() => import('@/components/sections/MarketplaceAdvantages')),
  AnimatedStats: lazy(() => import('@/components/sections/AnimatedStats')),
  FeatureTimeline: lazy(() => import('@/components/sections/FeatureTimeline')),
  FaqAccordion: lazy(() => import('@/components/sections/FaqAccordion')),
  InformBlock: lazy(() => import('@/components/InformBlock')),
  MapSection: lazy(() => import('@/components/MapSection')),
  SocialFeed: lazy(() => import('@/components/sections/SocialFeed')),
  CustomerReviews: lazy(() => import('@/components/sections/CustomerReviews')),
  TestimonialsCarousel: lazy(() => import('@/components/sections/TestimonialsCarousel')),
  CommunityFavorites: lazy(() => import('@/components/sections/CommunityFavorites')),
  InfluencerPicks: lazy(() => import('@/components/sections/InfluencerPicks')),
  SellerSpotlight: lazy(() => import('@/components/sections/SellerSpotlight')),
  SellerComparison: lazy(() => import('@/components/sections/SellerComparison')),
  SellersSection: lazy(() => import('@/components/SellersSection')),
  BrandShowcase: lazy(() => import('@/components/sections/BrandShowcase')),
  BrandStrip: lazy(() => import('@/components/home/CategoryVariants/BrandStrip')),
  AiRecommendations: lazy(() => import('@/components/sections/AiRecommendations')),
  RecentlyViewed: lazy(() => import('@/components/sections/RecentlyViewed')),
  TrendingGrid: lazy(() => import('@/components/sections/TrendingGrid')),
  Header: lazy(() => import('@/components/Header')),
  Footer: lazy(() => import('@/components/Footer')),
};

const BlockSkeleton = () => (
  <div className="w-full h-32 bg-muted animate-pulse rounded-lg" />
);

interface BlockRendererProps {
  block: BlockConfig;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const Component = componentMap[block.type];
  if (!Component) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
        Unknown block: {block.type}
      </div>
    );
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component {...block.settings} />
    </Suspense>
  );
};
