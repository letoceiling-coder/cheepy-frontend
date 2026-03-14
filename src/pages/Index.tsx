import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import ProductGrid from "@/components/ProductGrid";
import CategoryBanners from "@/components/CategoryBanners";
import LookOfTheDay from "@/components/LookOfTheDay";
import InformBlock from "@/components/InformBlock";
import SellersSection from "@/components/SellersSection";
import MapSection from "@/components/MapSection";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import PopularCategories from "@/components/sections/PopularCategories";
import HotDeals from "@/components/sections/HotDeals";
import SpecialOffers from "@/components/sections/SpecialOffers";
import Bestsellers from "@/components/sections/Bestsellers";
import TrendingProducts from "@/components/sections/TrendingProducts";
import CustomerReviews from "@/components/sections/CustomerReviews";
import CategorySliderSection from "@/components/home/CategorySliderSection";
import LightCategoryNav from "@/components/home/LightCategoryNav";
import CompactCategories from "@/components/home/CategoryVariants/CompactCategories";
import IconCategories from "@/components/home/CategoryVariants/IconCategories";
import BrandStrip from "@/components/home/CategoryVariants/BrandStrip";
import GridCategories from "@/components/home/CategoryVariants/GridCategories";

// Batch 1
import FeaturedCategories from "@/components/sections/FeaturedCategories";
import TrendingGrid from "@/components/sections/TrendingGrid";
import AnimatedStats from "@/components/sections/AnimatedStats";
import ProductShowcase from "@/components/sections/ProductShowcase";
import SellerSpotlight from "@/components/sections/SellerSpotlight";
import MarketplaceAdvantages from "@/components/sections/MarketplaceAdvantages";
import VideoGallery from "@/components/sections/VideoGallery";
import TestimonialsCarousel from "@/components/sections/TestimonialsCarousel";
import FeatureTimeline from "@/components/sections/FeatureTimeline";
import CategoriesMosaic from "@/components/sections/CategoriesMosaic";
import PromoBanner from "@/components/sections/PromoBanner";
import RecentlyViewed from "@/components/sections/RecentlyViewed";
import SocialFeed from "@/components/sections/SocialFeed";
import SellerComparison from "@/components/sections/SellerComparison";
import DealsCountdown from "@/components/sections/DealsCountdown";
import BrandShowcase from "@/components/sections/BrandShowcase";
import AiRecommendations from "@/components/sections/AiRecommendations";
import FaqAccordion from "@/components/sections/FaqAccordion";
import NewsletterBlock from "@/components/sections/NewsletterBlock";
import MarketplaceCta from "@/components/sections/MarketplaceCta";

// Batch 2
import CinematicHero from "@/components/sections/CinematicHero";
import SplitHero from "@/components/sections/SplitHero";
import LargeProductSlider from "@/components/sections/LargeProductSlider";
import LookbookSlider from "@/components/sections/LookbookSlider";
import MinimalProductGrid from "@/components/sections/MinimalProductGrid";
import CategoryMosaic from "@/components/sections/CategoryMosaic";
import CategoryCircleSlider from "@/components/sections/CategoryCircleSlider";
import VideoCampaign from "@/components/sections/VideoCampaign";
import VideoProductCard from "@/components/sections/VideoProductCard";
import MiniVideoGallery from "@/components/sections/MiniVideoGallery";
import PromoVideoBanner from "@/components/sections/PromoVideoBanner";

// Batch 3
import HeroProductPromo from "@/components/sections/HeroProductPromo";
import HeroWithSlider from "@/components/sections/HeroWithSlider";
import DailyDeals from "@/components/sections/DailyDeals";
import FlashSale from "@/components/sections/FlashSale";
import ProductCollection from "@/components/sections/ProductCollection";
import ProductComparison from "@/components/sections/ProductComparison";
import ProductDiscovery from "@/components/sections/ProductDiscovery";
import CategoryTabs from "@/components/sections/CategoryTabs";
import NewArrivals from "@/components/sections/NewArrivals";
import FeaturedCollection from "@/components/sections/FeaturedCollection";

// Quizzes
import ProductFinderQuiz from "@/components/sections/ProductFinderQuiz";
import DealDiscoveryQuiz from "@/components/sections/DealDiscoveryQuiz";
import LightningDealQuiz from "@/components/sections/LightningDealQuiz";
import StyleMatchQuiz from "@/components/sections/StyleMatchQuiz";
import GiftFinderQuiz from "@/components/sections/GiftFinderQuiz";

// Batch 4 — new blocks
import LifestyleGallery from "@/components/sections/LifestyleGallery";
import TopRatedProducts from "@/components/sections/TopRatedProducts";
import LimitedEdition from "@/components/sections/LimitedEdition";
import InfluencerPicks from "@/components/sections/InfluencerPicks";
import CommunityFavorites from "@/components/sections/CommunityFavorites";
import BundleDeals from "@/components/sections/BundleDeals";
import ProductConfigurator from "@/components/sections/ProductConfigurator";
import InteractiveProductCards from "@/components/sections/InteractiveProductCards";
import ProductHoverGrid from "@/components/sections/ProductHoverGrid";
import SplitVideoFeature from "@/components/sections/SplitVideoFeature";
import VideoProductStory from "@/components/sections/VideoProductStory";
import CombinedMediaBanner from "@/components/sections/CombinedMediaBanner";
import LifestyleVideoStrip from "@/components/sections/LifestyleVideoStrip";
import DiscoveryMixedGrid from "@/components/sections/DiscoveryMixedGrid";
import ShopTheLookGallery from "@/components/sections/ShopTheLookGallery";
import MediaProductSlider from "@/components/sections/MediaProductSlider";
import ProductDemoCards from "@/components/sections/ProductDemoCards";
import TiltProductCards from "@/components/sections/TiltProductCards";
import ProductRotationShowcase from "@/components/sections/ProductRotationShowcase";
import InteractiveLookbook from "@/components/sections/InteractiveLookbook";
import RandomModelShowcase from "@/components/sections/ModelShowcase/RandomModelShowcase";
import TrendingFashionShowcase from "@/components/sections/ModelShowcase/TrendingFashionShowcase";
import NewCollectionModels from "@/components/sections/ModelShowcase/NewCollectionModels";
import SplitProductBanner from "@/components/banners/SplitProductBanner";
import FullWidthPromoBanner from "@/components/banners/FullWidthPromoBanner";
import MultiProductBanner from "@/components/banners/MultiProductBanner";
import DiscountPromoBanner from "@/components/banners/DiscountPromoBanner";
import CategoryCtaBanner from "@/components/banners/CategoryCtaBanner";
import VideoHeroBanner from "@/components/banners/VideoHeroBanner";
import SplitVideoBanner from "@/components/banners/SplitVideoBanner";
import VideoDemoBanner from "@/components/banners/VideoDemoBanner";
import VideoCarouselBanner from "@/components/banners/VideoCarouselBanner";
import CinematicVideoBanner from "@/components/banners/CinematicVideoBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />

      <main className="homepage-flow">
        <div className="max-w-[1400px] mx-auto px-4">
          <HeroSlider />
          <CategoryCircleSlider />
          <CategorySliderSection />
          <LightCategoryNav />
          <FeaturedCategories />
          <PopularCategories />
          <MarketplaceAdvantages />
          <HeroProductPromo />
          <HotDeals />
          <ProductGrid title="ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ" initialCount={6} />
          <RandomModelShowcase />
          <LargeProductSlider />
          <DailyDeals />
          <DealsCountdown />
          <FlashSale />
          <LimitedEdition />
          <DiscountPromoBanner />
          <SplitProductBanner />
          <SpecialOffers />
          <TrendingFashionShowcase />
          <TrendingGrid />
          <CategoryTabs />
          <ProductFinderQuiz />
          <ProductGrid title="ПОПУЛЯРНОЕ В КАТЕГОРИИ" initialCount={6} />
          <TopRatedProducts />
          <CinematicHero />
          <HeroWithSlider />
          <PromoBanner />
          <FullWidthPromoBanner />
          <CategoryBanners />
          <FeaturedCollection />
          <Bestsellers />
          <NewCollectionModels />
          <NewArrivals />
          <LookbookSlider />
          <ProductShowcase />
          <BundleDeals />
          <MultiProductBanner />
          <CategoryCtaBanner />
          <ProductGrid title="НОВОЕ ПОСТУПЛЕНИЕ" initialCount={12} />
          <SplitHero />
          <ProductCollection />
          <LightningDealQuiz />
          <AnimatedStats />
          <TrendingProducts />
          <InteractiveProductCards />
          <MinimalProductGrid />
          <ProductHoverGrid />
          <RecentlyViewed />
          <LifestyleGallery />
          <CategoryMosaic />
          <CategoriesMosaic />
          <ProductDiscovery />
          <StyleMatchQuiz />
          <SplitVideoFeature />
          <VideoProductCard />
          <VideoGallery />
          <MiniVideoGallery />
          <ProductDemoCards />
          <VideoCampaign />
          <LifestyleVideoStrip />
          <DiscoveryMixedGrid />
          <ShopTheLookGallery />
          <MediaProductSlider />
          <VideoProductStory />
          <CombinedMediaBanner />
          <PromoVideoBanner />
          <VideoHeroBanner />
          <SplitVideoBanner />
          <VideoDemoBanner />
          <VideoCarouselBanner />
          <CinematicVideoBanner />
          <TiltProductCards />
          <InteractiveLookbook />
          <ProductRotationShowcase />
          <ProductConfigurator />
          <ProductComparison />
        </div>

        <section className="w-full">
          <div className="max-w-[1400px] mx-auto px-4">
            <LookOfTheDay />
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-4">
          <SellerSpotlight />
          <SellerComparison />
          <InfluencerPicks />
          <SocialFeed />
          <CommunityFavorites />
          <AiRecommendations />
          <TestimonialsCarousel />
          <FeatureTimeline />
          <CustomerReviews />
          <BrandShowcase />
          <CompactCategories />
          <IconCategories />
          <BrandStrip />
          <GridCategories />
          <SellersSection />
          <DealDiscoveryQuiz />
          <GiftFinderQuiz />
          <FaqAccordion />
          <NewsletterBlock />
          <MarketplaceCta />
          <InformBlock />
          <MapSection />
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
