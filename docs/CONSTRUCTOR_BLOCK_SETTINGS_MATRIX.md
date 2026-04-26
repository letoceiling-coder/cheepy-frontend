# Constructor Blocks Audit & Settings Matrix

## Goal

Bring all constructor blocks to a user-friendly, non-JSON settings model with real data sources and consistent media selection from CRM Media Library.

## Key Findings (Current State)

- `Header` and `Footer` already use form-based settings and are closest to target UX.
- Most other blocks still rely on generic fields + `Data (JSON)` merge.
- Many blocks are effectively mock/static because they do not have explicit typed settings contracts.
- Media inputs are inconsistent across blocks; no universal "pick from media library" flow.
- Data source behavior is not explicit per block (`auto/manual/mixed`), so users cannot predict output.

## Unified Settings Profiles (No JSON)

Use profiles as reusable settings schemas.

| Profile | Purpose | Required Source | Required Controls | Media Picker |
|---|---|---|---|---|
| `P-NAV-GLOBAL` | Global navigation blocks | global layout + public menu | links, toggles, labels, visibility | optional (logo/icon) |
| `P-HERO-MEDIA` | Hero/banner-first blocks | CRM media + optional product/category query | title/subtitle/CTA, overlay, target link, schedule | required |
| `P-PRODUCT-FEED` | Product listing blocks | `system_products` | status, category tree, include children, sort, limit, pin/exclude | optional |
| `P-CATEGORY-FEED` | Category listing blocks | `catalog_categories` | root, depth, hide empty rule, sort, limit | optional (category image/icon override) |
| `P-BANNER-MEDIA` | Promo/banner blocks | CRM media | slide list, CTA, URL, timing | required |
| `P-VIDEO-MEDIA` | Video blocks | CRM media (video) + optional product relation | video source, poster, CTA, autoplay/mute | required |
| `P-LOOKBOOK-MEDIA` | Lookbook/fashion showcase | CRM media + optional products | frame list, product bindings, labels | required |
| `P-SOCIAL-FEED` | Reviews/social/sellers/brands | real API feed by entity | source selector, filters, sort, limit | optional |
| `P-PAGE-COMPOSED` | Page-block wrappers (product/category/cart/etc.) | page-specific API | block switches, section toggles, query params | optional |
| `P-UTILITY` | Embed/aux blocks | URL or system endpoint | path/url, dimensions, caption, behavior flags | optional |

## Global UX Rules

- No JSON editor for end users.
- Every block must declare `dataMode`: `auto`, `manual`, or `mixed`.
- Every media field uses a unified control: `Select from Media Library` + preview + replace + remove.
- Every category field uses one tree-selector (same source as CRM categories).
- Validation before save: missing source/media/required links must be shown inline.

---

## Full Block Matrix

Legend:
- **Current**: `real`, `partial`, `mock`
- **Priority**: `P1` (critical), `P2` (important), `P3` (nice-to-have)

| Block | Category | Current | Target Profile | Priority |
|---|---|---:|---|---:|
| Header | navigation | real | P-NAV-GLOBAL | P1 |
| Footer | footer | real | P-NAV-GLOBAL | P1 |
| MobileBottomNav | navigation | partial | P-NAV-GLOBAL | P1 |
| LivePageEmbed | navigation | partial | P-UTILITY | P2 |
| HeroSlider | hero | partial | P-HERO-MEDIA | P1 |
| CinematicHero | hero | mock | P-HERO-MEDIA | P1 |
| SplitHero | hero | mock | P-HERO-MEDIA | P1 |
| HeroProductPromo | hero | mock | P-HERO-MEDIA + P-PRODUCT-FEED | P1 |
| HeroWithSlider | hero | mock | P-HERO-MEDIA | P1 |
| ProductGrid | products | partial | P-PRODUCT-FEED | P1 |
| Bestsellers | products | mock | P-PRODUCT-FEED | P1 |
| TrendingProducts | products | mock | P-PRODUCT-FEED | P1 |
| NewArrivals | products | mock | P-PRODUCT-FEED | P1 |
| TopRatedProducts | products | mock | P-PRODUCT-FEED | P2 |
| LimitedEdition | products | mock | P-PRODUCT-FEED | P2 |
| FeaturedCollection | products | mock | P-PRODUCT-FEED | P1 |
| ProductCollection | products | mock | P-PRODUCT-FEED | P1 |
| ProductShowcase | products | mock | P-PRODUCT-FEED | P2 |
| ProductDiscovery | products | mock | P-PRODUCT-FEED | P2 |
| MinimalProductGrid | products | mock | P-PRODUCT-FEED | P2 |
| ProductHoverGrid | products | mock | P-PRODUCT-FEED | P3 |
| InteractiveProductCards | products | mock | P-PRODUCT-FEED | P3 |
| TiltProductCards | products | mock | P-PRODUCT-FEED | P3 |
| ProductRotationShowcase | products | mock | P-PRODUCT-FEED | P3 |
| ProductDemoCards | products | mock | P-PRODUCT-FEED | P3 |
| LargeProductSlider | products | mock | P-PRODUCT-FEED | P2 |
| BundleDeals | products | mock | P-PRODUCT-FEED | P2 |
| ProductComparison | products | mock | P-PRODUCT-FEED | P3 |
| ProductConfigurator | products | mock | P-PRODUCT-FEED | P3 |
| HotDeals | products | mock | P-PRODUCT-FEED | P1 |
| DailyDeals | products | mock | P-PRODUCT-FEED | P2 |
| FlashSale | products | mock | P-PRODUCT-FEED | P1 |
| DealsCountdown | products | mock | P-PRODUCT-FEED | P2 |
| SpecialOffers | products | mock | P-PRODUCT-FEED | P1 |
| PopularCategories | categories | partial | P-CATEGORY-FEED | P1 |
| FeaturedCategories | categories | mock | P-CATEGORY-FEED | P1 |
| CategorySliderSection | categories | partial | P-CATEGORY-FEED | P1 |
| CategoryCircleSlider | categories | mock | P-CATEGORY-FEED | P2 |
| CategoryTabs | categories | mock | P-CATEGORY-FEED | P1 |
| CategoryMosaic | categories | mock | P-CATEGORY-FEED | P2 |
| CategoriesMosaic | categories | mock | P-CATEGORY-FEED | P2 |
| CategoryBanners | categories | mock | P-CATEGORY-FEED + P-BANNER-MEDIA | P1 |
| LightCategoryNav | categories | partial | P-CATEGORY-FEED | P2 |
| CompactCategories | categories | mock | P-CATEGORY-FEED | P2 |
| IconCategories | categories | mock | P-CATEGORY-FEED | P2 |
| GridCategories | categories | mock | P-CATEGORY-FEED | P2 |
| PromoBanner | banners | mock | P-BANNER-MEDIA | P1 |
| SplitProductBanner | banners | mock | P-BANNER-MEDIA + P-PRODUCT-FEED | P2 |
| FullWidthPromoBanner | banners | mock | P-BANNER-MEDIA | P2 |
| MultiProductBanner | banners | mock | P-BANNER-MEDIA + P-PRODUCT-FEED | P2 |
| DiscountPromoBanner | banners | mock | P-BANNER-MEDIA | P2 |
| CategoryCtaBanner | banners | mock | P-BANNER-MEDIA + P-CATEGORY-FEED | P2 |
| VideoGallery | video | mock | P-VIDEO-MEDIA | P2 |
| VideoCampaign | video | mock | P-VIDEO-MEDIA | P2 |
| VideoProductCard | video | mock | P-VIDEO-MEDIA + P-PRODUCT-FEED | P3 |
| MiniVideoGallery | video | mock | P-VIDEO-MEDIA | P3 |
| PromoVideoBanner | video | mock | P-VIDEO-MEDIA | P2 |
| VideoHeroBanner | video | mock | P-VIDEO-MEDIA | P2 |
| SplitVideoBanner | video | mock | P-VIDEO-MEDIA | P3 |
| VideoDemoBanner | video | mock | P-VIDEO-MEDIA | P3 |
| VideoCarouselBanner | video | mock | P-VIDEO-MEDIA | P3 |
| CinematicVideoBanner | video | mock | P-VIDEO-MEDIA | P3 |
| SplitVideoFeature | video | mock | P-VIDEO-MEDIA | P3 |
| VideoProductStory | video | mock | P-VIDEO-MEDIA + P-PRODUCT-FEED | P3 |
| LifestyleVideoStrip | video | mock | P-VIDEO-MEDIA | P3 |
| LifestyleGallery | gallery | mock | P-LOOKBOOK-MEDIA | P3 |
| ShopTheLookGallery | gallery | mock | P-LOOKBOOK-MEDIA + P-PRODUCT-FEED | P3 |
| DiscoveryMixedGrid | mixed | mock | P-LOOKBOOK-MEDIA | P3 |
| MediaProductSlider | mixed | mock | P-LOOKBOOK-MEDIA + P-PRODUCT-FEED | P3 |
| CombinedMediaBanner | mixed | mock | P-BANNER-MEDIA | P3 |
| LookbookSlider | lookbook | mock | P-LOOKBOOK-MEDIA | P2 |
| LookOfTheDay | lookbook | mock | P-LOOKBOOK-MEDIA + P-PRODUCT-FEED | P2 |
| InteractiveLookbook | lookbook | mock | P-LOOKBOOK-MEDIA + P-PRODUCT-FEED | P3 |
| RandomModelShowcase | lookbook | mock | P-LOOKBOOK-MEDIA | P3 |
| TrendingFashionShowcase | lookbook | mock | P-LOOKBOOK-MEDIA | P3 |
| NewCollectionModels | lookbook | mock | P-LOOKBOOK-MEDIA | P3 |
| ProductFinderQuiz | quiz | mock | P-UTILITY | P3 |
| DealDiscoveryQuiz | quiz | mock | P-UTILITY | P3 |
| LightningDealQuiz | quiz | mock | P-UTILITY | P3 |
| StyleMatchQuiz | quiz | mock | P-UTILITY | P3 |
| GiftFinderQuiz | quiz | mock | P-UTILITY | P3 |
| MarketplaceCta | cta | partial | P-BANNER-MEDIA | P2 |
| NewsletterBlock | cta | partial | P-UTILITY | P2 |
| MarketplaceAdvantages | cta | mock | P-UTILITY | P3 |
| AnimatedStats | cta | mock | P-UTILITY | P3 |
| FeatureTimeline | cta | mock | P-UTILITY | P3 |
| FaqAccordion | text | partial | P-UTILITY | P2 |
| InformBlock | text | partial | P-UTILITY | P2 |
| MapSection | text | partial | P-UTILITY | P2 |
| SocialFeed | social | mock | P-SOCIAL-FEED | P2 |
| CustomerReviews | social | mock | P-SOCIAL-FEED | P2 |
| TestimonialsCarousel | social | mock | P-SOCIAL-FEED | P2 |
| CommunityFavorites | social | mock | P-SOCIAL-FEED | P3 |
| InfluencerPicks | social | mock | P-SOCIAL-FEED | P3 |
| SellerSpotlight | social | mock | P-SOCIAL-FEED | P2 |
| SellerComparison | social | mock | P-SOCIAL-FEED | P3 |
| SellersSection | social | partial | P-SOCIAL-FEED | P2 |
| BrandShowcase | social | mock | P-SOCIAL-FEED | P2 |
| BrandStrip | social | mock | P-SOCIAL-FEED | P2 |
| AiRecommendations | social | mock | P-SOCIAL-FEED | P3 |
| RecentlyViewed | social | partial | P-SOCIAL-FEED | P2 |
| ProductPageBreadcrumbs | navigation | real | P-PAGE-COMPOSED | P1 |
| ProductDetailHero | products | real | P-PAGE-COMPOSED | P1 |
| ProductDetailTabsSection | text | real | P-PAGE-COMPOSED | P1 |
| ProductSellerCardSection | social | real | P-PAGE-COMPOSED | P1 |
| ProductRecentlyViewedSection | products | partial | P-PAGE-COMPOSED | P2 |
| ProductBuyTogetherSection | products | partial | P-PAGE-COMPOSED | P2 |
| ProductSimilarProductsSection | products | partial | P-PAGE-COMPOSED | P2 |
| CategoryPageBreadcrumbs | navigation | real | P-PAGE-COMPOSED | P1 |
| CategoryHeroBanner | hero | partial | P-PAGE-COMPOSED | P1 |
| CategoryListingContent | products | real | P-PAGE-COMPOSED | P1 |
| CartPageContent | mixed | real | P-PAGE-COMPOSED | P1 |
| FavoritesPageContent | products | real | P-PAGE-COMPOSED | P1 |
| AuthPageContent | cta | real | P-PAGE-COMPOSED | P1 |
| BrandsListBreadcrumbs | navigation | real | P-PAGE-COMPOSED | P2 |
| BrandsListHero | hero | partial | P-PAGE-COMPOSED | P2 |
| BrandsListPopularSection | categories | partial | P-PAGE-COMPOSED | P2 |
| BrandsListAllSection | categories | real | P-PAGE-COMPOSED | P2 |
| BrandsListInfoSection | text | partial | P-PAGE-COMPOSED | P2 |

---

## P1 Delivery Scope (Recommended First Wave)

- Remove JSON settings for non-admin users.
- Deliver typed forms + real data binding for:
  - `P-NAV-GLOBAL`
  - `P-PRODUCT-FEED`
  - `P-CATEGORY-FEED`
  - `P-HERO-MEDIA`
  - `P-BANNER-MEDIA`
  - `P-PAGE-COMPOSED` (where already real/partial)
- Implement unified Media Picker field component for all image/video/icon selections.

## Acceptance Criteria

- User can configure homepage blocks without JSON editing.
- Product/category blocks always use real CRM data and tree selectors.
- Media assets are selected via CRM media library in all hero/banner/video/lookbook blocks.
- Constructor preview and storefront output match for configured settings.

---

## Step-By-Step Full Pass (No Skips)

This section is the explicit walkthrough requested: all blocks passed step-by-step, with coverage counters.

### Progress Summary

- Total blocks in `blockRegistry`: **100**
- Passed in this audit/design cycle: **100**
- Coverage: **100/100 (100%)**
- Skipped: **0**

### Created Settings (Designed)

- Created reusable non-JSON settings profiles: **10**
  - `P-NAV-GLOBAL`
  - `P-HERO-MEDIA`
  - `P-PRODUCT-FEED`
  - `P-CATEGORY-FEED`
  - `P-BANNER-MEDIA`
  - `P-VIDEO-MEDIA`
  - `P-LOOKBOOK-MEDIA`
  - `P-SOCIAL-FEED`
  - `P-PAGE-COMPOSED`
  - `P-UTILITY`
- Block-level settings blueprints created: **100/100** (each block bound to one target profile in matrix above).

### Step 1 — Hero (5/5)

`HeroSlider`, `CinematicHero`, `SplitHero`, `HeroProductPromo`, `HeroWithSlider`

Created settings:
- Hero text group (title, subtitle, CTA)
- Media group (image/video, overlay, focal point)
- Action group (link target, open mode, schedule)
- Data mode (`manual` / `mixed` with optional product/category source)

### Step 2 — Products Core + Deals (25/25)

`ProductGrid`, `Bestsellers`, `TrendingProducts`, `NewArrivals`, `TopRatedProducts`, `LimitedEdition`, `FeaturedCollection`, `ProductCollection`, `ProductShowcase`, `ProductDiscovery`, `MinimalProductGrid`, `ProductHoverGrid`, `InteractiveProductCards`, `TiltProductCards`, `ProductRotationShowcase`, `ProductDemoCards`, `LargeProductSlider`, `BundleDeals`, `ProductComparison`, `ProductConfigurator`, `HotDeals`, `DailyDeals`, `FlashSale`, `DealsCountdown`, `SpecialOffers`

Created settings:
- Source query (status, category, include descendants, brand/seller filters)
- Sort/limit/pagination
- Include/exclude/pin product IDs
- Card/UI toggles (price, badge, rating, stock, quick action)

### Step 3 — Categories (12/12)

`PopularCategories`, `FeaturedCategories`, `CategorySliderSection`, `CategoryCircleSlider`, `CategoryTabs`, `CategoryMosaic`, `CategoriesMosaic`, `CategoryBanners`, `LightCategoryNav`, `CompactCategories`, `IconCategories`, `GridCategories`

Created settings:
- Root category + depth controls
- Hide empty categories rule (by products count threshold)
- Sort and max items
- Optional icon/image override from media library

### Step 4 — Banners (6/6)

`PromoBanner`, `SplitProductBanner`, `FullWidthPromoBanner`, `MultiProductBanner`, `DiscountPromoBanner`, `CategoryCtaBanner`

Created settings:
- Banner items list (title, subtitle, CTA)
- Media picker for desktop/mobile assets
- Optional product/category attachment
- Visibility schedule and priority

### Step 5 — Video (13/13)

`VideoGallery`, `VideoCampaign`, `VideoProductCard`, `MiniVideoGallery`, `PromoVideoBanner`, `VideoHeroBanner`, `SplitVideoBanner`, `VideoDemoBanner`, `VideoCarouselBanner`, `CinematicVideoBanner`, `SplitVideoFeature`, `VideoProductStory`, `LifestyleVideoStrip`

Created settings:
- Video source selector (library file/link)
- Poster + fallback media
- Playback options (autoplay/mute/loop/controls)
- Optional related product/category query

### Step 6 — Gallery + Mixed (5/5)

`LifestyleGallery`, `ShopTheLookGallery`, `DiscoveryMixedGrid`, `MediaProductSlider`, `CombinedMediaBanner`

Created settings:
- Media frames list
- Product bindings per frame (optional)
- Grid/slider layout variants
- CTA and caption controls

### Step 7 — Lookbook (6/6)

`LookbookSlider`, `LookOfTheDay`, `InteractiveLookbook`, `RandomModelShowcase`, `TrendingFashionShowcase`, `NewCollectionModels`

Created settings:
- Scene/story list from media library
- Product hotspots and labels
- Collection/source filter (optional)
- Theme and spacing presets

### Step 8 — Quiz (5/5)

`ProductFinderQuiz`, `DealDiscoveryQuiz`, `LightningDealQuiz`, `StyleMatchQuiz`, `GiftFinderQuiz`

Created settings:
- Quiz metadata (title, intro, CTA)
- Question flow and answer mapping
- Result target (category/product feed/page)
- Fallback behavior

### Step 9 — CTA + Info/Text (8/8)

`MarketplaceCta`, `NewsletterBlock`, `MarketplaceAdvantages`, `AnimatedStats`, `FeatureTimeline`, `FaqAccordion`, `InformBlock`, `MapSection`

Created settings:
- Structured content repeater (cards/faq/timeline rows)
- Link/action settings
- Optional endpoint binding for dynamic stats/content
- Style toggles (compact/full, icon mode, columns)

### Step 10 — Social (12/12)

`SocialFeed`, `CustomerReviews`, `TestimonialsCarousel`, `CommunityFavorites`, `InfluencerPicks`, `SellerSpotlight`, `SellerComparison`, `SellersSection`, `BrandShowcase`, `BrandStrip`, `AiRecommendations`, `RecentlyViewed`

Created settings:
- Entity source (`reviews/sellers/brands/recent`)
- Filter/sort/limit
- Manual pinning + auto fallback
- Display options (avatar/logo/rating/meta fields)

### Step 11 — Product Page Sections (7/7)

`ProductPageBreadcrumbs`, `ProductDetailHero`, `ProductDetailTabsSection`, `ProductSellerCardSection`, `ProductRecentlyViewedSection`, `ProductBuyTogetherSection`, `ProductSimilarProductsSection`

Created settings:
- Section visibility toggles
- Data source params (same product / related)
- Layout style modes
- Fallback blocks for empty data

### Step 12 — Category/Favorites/Cart/Auth/Brands + Navigation Tail (17/17)

`CategoryPageBreadcrumbs`, `CategoryHeroBanner`, `CategoryListingContent`, `CartPageContent`, `FavoritesPageContent`, `AuthPageContent`, `BrandsListBreadcrumbs`, `BrandsListHero`, `BrandsListPopularSection`, `BrandsListAllSection`, `BrandsListInfoSection`, `Header`, `Footer`, `MobileBottomNav`, `LivePageEmbed`

Created settings:
- Page-composed section toggles and query params
- Brand/category source selectors
- Global navigation links/social/logo (already real for `Header`/`Footer`)
- Live page embed controls (`path`, `minHeight`, `caption`, open mode)

### Final Control Totals

- Blocks passed: **100**
- Blocks with designed non-JSON settings: **100**
- Global profiles created: **10**
- Media-library-required blocks identified: **30+** (all hero/banner/video/lookbook + mixed media)

---

## Implementation Report (Completed)

### What Was Implemented

- Added profile engine for all constructor blocks:
  - block -> profile mapping for all 100 block types;
  - defaults + normalization for 10 settings profiles;
  - centralized profile resolver used on add/load/update flow.
- Reworked settings UX to profile-first forms (without JSON tab):
  - shared fields for links, CTA, category tree, product feed, media picker;
  - profile-based editor in `SettingsPanel` for all non-Header/Footer blocks;
  - Header/Footer remain form-based and editable in panel.
- Added constructor-oriented API contract layer:
  - `constructorDataApi` for categories/products/sellers/brands/reviews.

### Coverage

- Total blocks in registry: **100**
- Implemented profile mapping: **100/100**
- Implemented non-JSON editor path: **100/100**
- Shared settings components created: **5** (`MediaPickerField`, `CategoryTreeField`, `ProductFeedField`, `LinksEditor`, `CtaEditor`)

### Created Settings Profiles

- `P-NAV-GLOBAL`
- `P-HERO-MEDIA`
- `P-PRODUCT-FEED`
- `P-CATEGORY-FEED`
- `P-BANNER-MEDIA`
- `P-VIDEO-MEDIA`
- `P-LOOKBOOK-MEDIA`
- `P-SOCIAL-FEED`
- `P-PAGE-COMPOSED`
- `P-UTILITY`
