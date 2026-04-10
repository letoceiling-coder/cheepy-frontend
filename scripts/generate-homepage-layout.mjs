/**
 * Единый источник порядка блоков главной (1:1 с Index.tsx).
 * Запуск: node scripts/generate-homepage-layout.mjs
 * Пишет: src/constructor/builtin/homepageLayout.json
 *        ../sadavod-laravel/database/data/homepage_layout_spec.json
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const spec = [
  ['HeroSlider', {}],
  ['CategoryCircleSlider', {}],
  ['CategorySliderSection', {}],
  ['LightCategoryNav', {}],
  ['FeaturedCategories', {}],
  ['PopularCategories', {}],
  ['MarketplaceAdvantages', {}],
  ['HeroProductPromo', {}],
  ['HotDeals', {}],
  ['ProductGrid', { title: 'ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ', initialCount: 6 }],
  ['RandomModelShowcase', {}],
  ['LargeProductSlider', {}],
  ['DailyDeals', {}],
  ['DealsCountdown', {}],
  ['FlashSale', {}],
  ['LimitedEdition', {}],
  ['DiscountPromoBanner', {}],
  ['SplitProductBanner', {}],
  ['SpecialOffers', {}],
  ['TrendingFashionShowcase', {}],
  ['TrendingGrid', {}],
  ['CategoryTabs', {}],
  ['ProductFinderQuiz', {}],
  ['ProductGrid', { title: 'ПОПУЛЯРНОЕ В КАТЕГОРИИ', initialCount: 6 }],
  ['TopRatedProducts', {}],
  ['CinematicHero', {}],
  ['HeroWithSlider', {}],
  ['PromoBanner', {}],
  ['FullWidthPromoBanner', {}],
  ['CategoryBanners', {}],
  ['FeaturedCollection', {}],
  ['Bestsellers', {}],
  ['NewCollectionModels', {}],
  ['NewArrivals', {}],
  ['LookbookSlider', {}],
  ['ProductShowcase', {}],
  ['BundleDeals', {}],
  ['MultiProductBanner', {}],
  ['CategoryCtaBanner', {}],
  ['ProductGrid', { title: 'НОВОЕ ПОСТУПЛЕНИЕ', initialCount: 12 }],
  ['SplitHero', {}],
  ['ProductCollection', {}],
  ['LightningDealQuiz', {}],
  ['AnimatedStats', {}],
  ['TrendingProducts', {}],
  ['InteractiveProductCards', {}],
  ['MinimalProductGrid', {}],
  ['ProductHoverGrid', {}],
  ['RecentlyViewed', {}],
  ['LifestyleGallery', {}],
  ['CategoryMosaic', {}],
  ['CategoriesMosaic', {}],
  ['ProductDiscovery', {}],
  ['StyleMatchQuiz', {}],
  ['SplitVideoFeature', {}],
  ['VideoProductCard', {}],
  ['VideoGallery', {}],
  ['MiniVideoGallery', {}],
  ['ProductDemoCards', {}],
  ['VideoCampaign', {}],
  ['LifestyleVideoStrip', {}],
  ['DiscoveryMixedGrid', {}],
  ['ShopTheLookGallery', {}],
  ['MediaProductSlider', {}],
  ['VideoProductStory', {}],
  ['CombinedMediaBanner', {}],
  ['PromoVideoBanner', {}],
  ['VideoHeroBanner', {}],
  ['SplitVideoBanner', {}],
  ['VideoDemoBanner', {}],
  ['VideoCarouselBanner', {}],
  ['CinematicVideoBanner', {}],
  ['TiltProductCards', {}],
  ['InteractiveLookbook', {}],
  ['ProductRotationShowcase', {}],
  ['ProductConfigurator', {}],
  ['ProductComparison', {}],
  ['LookOfTheDay', {}],
  ['SellerSpotlight', {}],
  ['SellerComparison', {}],
  ['InfluencerPicks', {}],
  ['SocialFeed', {}],
  ['CommunityFavorites', {}],
  ['AiRecommendations', {}],
  ['TestimonialsCarousel', {}],
  ['FeatureTimeline', {}],
  ['CustomerReviews', {}],
  ['BrandShowcase', {}],
  ['CompactCategories', {}],
  ['IconCategories', {}],
  ['BrandStrip', {}],
  ['GridCategories', {}],
  ['SellersSection', {}],
  ['DealDiscoveryQuiz', {}],
  ['GiftFinderQuiz', {}],
  ['FaqAccordion', {}],
  ['NewsletterBlock', {}],
  ['MarketplaceCta', {}],
  ['InformBlock', {}],
  ['MapSection', {}],
].map(([type, settings]) =>
  Object.keys(settings).length ? { type, settings } : { type }
);

const out = JSON.stringify(spec, null, 2);
const fe = join(root, 'src/constructor/builtin/homepageLayout.json');
const be = join(root, '..', 'sadavod-laravel', 'database', 'data', 'homepage_layout_spec.json');
fs.mkdirSync(dirname(fe), { recursive: true });
fs.writeFileSync(fe, out, 'utf8');
fs.mkdirSync(dirname(be), { recursive: true });
fs.writeFileSync(be, out, 'utf8');
console.log('Wrote', fe);
console.log('Wrote', be, `(${spec.length} blocks)`);
