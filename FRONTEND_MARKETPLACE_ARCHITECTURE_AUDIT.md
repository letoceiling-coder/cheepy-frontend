# Frontend Marketplace Architecture Audit

**Project:** React + TypeScript + Vite marketplace application  
**Audit date:** 2025-03-16  
**Scope:** Full frontend structure, routing, pages, components, state, API, domain model, admin/CRM, constructor, problems and recommendations.

---

## 1. PROJECT OVERVIEW

### 1.1 Stack

- **Framework:** React 18 with TypeScript
- **Build:** Vite
- **Routing:** react-router-dom v6 (BrowserRouter, Routes, Route, Outlet, useLocation)
- **State:** React Context (Auth, Cart, Favorites, LoginPrompt); Admin: AdminAuthContext; CRM: RbacContext, TenantContext
- **Data fetching:** @tanstack/react-query (admin/parser); no React Query on public/customer pages
- **UI:** Custom components + shadcn/ui (Toaster, Sonner, TooltipProvider, Dialog, Tabs, Sidebar, etc.)
- **Animation:** framer-motion (AnimatePresence, PageTransition)
- **Real-time:** Laravel Echo (useParserChannel) for parser WebSocket on admin

### 1.2 Repository structure (frontend)

```
src/
├── App.tsx                    # Root: providers, router, animated routes
├── main.tsx
├── contexts/                  # Auth, Cart, Favorites, LoginPrompt
├── lib/
│   ├── api.ts                 # Single API client (backend: online-parser.siteaacess.store/api/v1)
│   ├── echo.ts                # Laravel Echo / Reverb for parser channel
│   └── utils.ts
├── hooks/                     # useDragScroll, useParserChannel, useScrollAnimation, use-toast, use-mobile
├── data/
│   ├── mock-data.ts           # Product, Order, User, Coupon, etc. (public + account/person)
│   └── marketplaceData.ts     # Categories, brands, sellers, hotDeals, bestsellers, etc.
├── pages/                     # Public + account + person + info
├── components/                # Header, Footer, ProductCard, sections/, banners/, home/, ui/
├── constructor/               # Page builder (blocks, canvas, templates in localStorage)
├── admin/                     # Parser, products, categories, sellers, brands, etc. (real API)
└── crm/                       # CRM UI (mock data only; no API integration)
```

### 1.3 Data flow summary

- **Public marketplace (home, category, product, brand, seller, cart, favorites):** Uses **mock data** from `src/data/mock-data.ts` and `src/data/marketplaceData.ts`. The **public API** in `src/lib/api.ts` (`publicApi`: menu, categoryProducts, product, seller, search, featured) is **defined but never used** by any public page.
- **Account & Person cabinets:** Same mock data (mockUser, mockOrders, mockCoupons, mockProducts). No backend auth or user/order APIs.
- **Admin:** Uses **real API** (auth, dashboard, parser, products, categories, sellers, brands, excluded, filters, admin users/roles, logs, settings, attribute rules). Token in `localStorage.admin_token`. 401 triggers redirect to `/admin/login`.
- **CRM:** Uses **mock data** from `src/crm/data/mock-data.ts` only. No `@/lib/api` or fetch/axios usage in CRM.

---

## 2. ROUTING MAP

Routing is defined in `src/App.tsx` inside `AnimatedRoutes` (no `useRoutes`, no lazy imports). All page components are imported synchronously at the top of App.tsx.

### 2.1 Route table

| Path | Component | Layout | Guard | File |
|------|-----------|--------|-------|------|
| `/` | Index | — | — | src/pages/Index.tsx |
| `/auth` | AuthPage | — | — | src/pages/AuthPage.tsx |
| `/category/:slug` | CategoryPage | — | — | src/pages/CategoryPage.tsx |
| `/product/:id` | ProductPage | — | — | src/pages/ProductPage.tsx |
| `/favorites` | FavoritesPage | — | — | src/pages/FavoritesPage.tsx |
| `/cart` | CartPage | — | — | src/pages/CartPage.tsx |
| `/brand` | BrandsListPage | — | — | src/pages/BrandsListPage.tsx |
| `/brand/:slug` | BrandPage | — | — | src/pages/BrandPage.tsx |
| `/seller` | SellersListPage | — | — | src/pages/SellersListPage.tsx |
| `/seller/:id` | SellerPage | — | — | src/pages/SellerPage.tsx |
| `/account` | AccountLayout (Outlet) | AccountLayout | None (comment: "demo mode") | src/pages/account/AccountLayout.tsx |
| `/account` (index) | PersonalDataPage | AccountLayout | — | src/pages/account/PersonalDataPage.tsx |
| `/account/orders` | OrdersPage | AccountLayout | — | src/pages/account/OrdersPage.tsx |
| `/account/payment` | PaymentMethodsPage | AccountLayout | — | src/pages/account/PaymentMethodsPage.tsx |
| `/account/balance` | BalancePage | AccountLayout | — | src/pages/account/BalancePage.tsx |
| `/account/favorites` | FavoritesPage | AccountLayout | — | src/pages/FavoritesPage.tsx |
| `/account/coupons` | CouponsPage | AccountLayout | — | src/pages/account/CouponsPage.tsx |
| `/account/receipts` | ReceiptsPage | AccountLayout | — | src/pages/account/ReceiptsPage.tsx |
| `/account/referral` | ReferralPage | AccountLayout | — | src/pages/account/ReferralPage.tsx |
| `/account/password` | ChangePasswordPage | AccountLayout | — | src/pages/account/ChangePasswordPage.tsx |
| `/person` | PersonLayout (Outlet) | PersonLayout | None (comment: "без авторизации") | src/pages/person/PersonLayout.tsx |
| `/person` (index) | PersonDashboard | PersonLayout | — | src/pages/person/PersonDashboard.tsx |
| `/person/dashboard` | PersonDashboard | PersonLayout | — | src/pages/person/PersonDashboard.tsx |
| `/person/profile` | PersonProfile | PersonLayout | — | src/pages/person/PersonProfile.tsx |
| `/person/orders` | PersonOrders | PersonLayout | — | src/pages/person/PersonOrders.tsx |
| `/person/order/:id` | PersonOrderDetail | PersonLayout | — | src/pages/person/PersonOrderDetail.tsx |
| `/person/payments` | PersonPayments | PersonLayout | — | src/pages/person/PersonPayments.tsx |
| `/person/password` | PersonPassword | PersonLayout | — | src/pages/person/PersonPassword.tsx |
| `/person/returns` | PersonReturns | PersonLayout | — | src/pages/person/PersonReturns.tsx |
| `/person/favorites` | PersonFavorites | PersonLayout | — | src/pages/person/PersonFavorites.tsx |
| `/person/viewed` | PersonRecentlyViewed | PersonLayout | — | src/pages/person/PersonRecentlyViewed.tsx |
| `/person/addresses` | PersonAddresses | PersonLayout | — | src/pages/person/PersonAddresses.tsx |
| `/person/subscriptions` | PersonSubscriptions | PersonLayout | — | src/pages/person/PersonSubscriptions.tsx |
| `/person/coupons` | PersonCoupons | PersonLayout | — | src/pages/person/PersonCoupons.tsx |
| `/person/notifications` | PersonNotifications | PersonLayout | — | src/pages/person/PersonNotifications.tsx |
| `/person/support` | PersonSupport | PersonLayout | — | src/pages/person/PersonSupport.tsx |
| `/person/security` | PersonSecurity | PersonLayout | — | src/pages/person/PersonSecurity.tsx |
| `/person/settings` | PersonSettings | PersonLayout | — | src/pages/person/PersonSettings.tsx |
| `/how-to-order` | HowToOrderPage | — | — | src/pages/info/HowToOrderPage.tsx |
| `/payment` | PaymentInfoPage | — | — | src/pages/info/PaymentInfoPage.tsx |
| `/delivery` | DeliveryPage | — | — | src/pages/info/DeliveryPage.tsx |
| `/returns` | ReturnsPage | — | — | src/pages/info/ReturnsPage.tsx |
| `/faq` | FaqPage | — | — | src/pages/info/FaqPage.tsx |
| `/sell` | SellPage | — | — | src/pages/info/SellPage.tsx |
| `/rules` | RulesPage | — | — | src/pages/info/RulesPage.tsx |
| `/commission` | CommissionPage | — | — | src/pages/info/CommissionPage.tsx |
| `/seller-help` | SellerHelpPage | — | — | src/pages/info/SellerHelpPage.tsx |
| `/about` | AboutPage | — | — | src/pages/info/AboutPage.tsx |
| `/contacts` | ContactsPage | — | — | src/pages/info/ContactsPage.tsx |
| `/careers` | CareersPage | — | — | src/pages/info/CareersPage.tsx |
| `/blog` | BlogPage | — | — | src/pages/info/BlogPage.tsx |
| `/constructor` | ConstructorPage | — | — | src/constructor/pages/ConstructorPage.tsx |
| `/constructor/*` | ConstructorPage | — | — | same |
| `/admin` | AdminAuthProvider (Outlet) | — | — | — |
| `/admin/login` | AdminLoginPage | — | — | src/admin/pages/AdminLoginPage.tsx |
| `/admin` (index) | DashboardPage | AdminLayout | AdminAuthGuard | src/admin/pages/DashboardPage.tsx |
| `/admin/parser` | ParserPage | AdminLayout | AdminAuthGuard | src/admin/pages/ParserPage.tsx |
| `/admin/products` | ProductsPage | AdminLayout | AdminAuthGuard | src/admin/pages/ProductsPage.tsx |
| `/admin/products/:id` | ProductDetailPage | AdminLayout | AdminAuthGuard | src/admin/pages/ProductDetailPage.tsx |
| `/admin/categories` | CategoriesPage | AdminLayout | AdminAuthGuard | src/admin/pages/CategoriesPage.tsx |
| `/admin/sellers` | SellersPage | AdminLayout | AdminAuthGuard | src/admin/pages/SellersPage.tsx |
| `/admin/sellers/:id` | SellerDetailPage | AdminLayout | AdminAuthGuard | src/admin/pages/SellerDetailPage.tsx |
| `/admin/brands` | BrandsPage | AdminLayout | AdminAuthGuard | src/admin/pages/BrandsPage.tsx |
| `/admin/filters` | FiltersPage | AdminLayout | AdminAuthGuard | src/admin/pages/FiltersPage.tsx |
| `/admin/ai` | AiPage | AdminLayout | AdminAuthGuard | src/admin/pages/AiPage.tsx |
| `/admin/scheduler` | SchedulerPage | AdminLayout | AdminAuthGuard | src/admin/pages/SchedulerPage.tsx |
| `/admin/excluded` | ExcludedPage | AdminLayout | AdminAuthGuard | src/admin/pages/ExcludedPage.tsx |
| `/admin/logs` | LogsPage | AdminLayout | AdminAuthGuard | src/admin/pages/LogsPage.tsx |
| `/admin/docs` | DocsPage | AdminLayout | AdminAuthGuard | src/admin/pages/DocsPage.tsx |
| `/admin/attribute-rules` | AttributeRulesPage | AdminLayout | AdminAuthGuard | src/admin/pages/AttributeRulesPage.tsx |
| `/admin/users` | UsersPage | AdminLayout | AdminAuthGuard | src/admin/pages/UsersPage.tsx |
| `/admin/roles` | RolesPage | AdminLayout | AdminAuthGuard | src/admin/pages/RolesPage.tsx |
| `/admin/settings` | SettingsPage | AdminLayout | AdminAuthGuard | src/admin/pages/SettingsPage.tsx |
| `/crm` | CrmLayout (Outlet) | CrmLayout | None | src/crm/layout/CrmLayout.tsx |
| `/crm` (index) | CrmDashboardPage | CrmLayout | — | src/crm/pages/CrmDashboardPage.tsx |
| `/crm/dashboard` | CrmDashboardPage | CrmLayout | — | same |
| `/crm/content` | CrmContentPage | CrmLayout | — | src/crm/pages/CrmContentPage.tsx |
| `/crm/notifications` | CrmNotificationsPage | CrmLayout | — | src/crm/pages/CrmNotificationsPage.tsx |
| `/crm/products` | CrmProductsPage | CrmLayout | — | src/crm/pages/CrmProductsPage.tsx |
| `/crm/products/:id` | CrmProductDetailPage | CrmLayout | — | src/crm/pages/CrmProductDetailPage.tsx |
| `/crm/categories` | CrmCategoriesPage | CrmLayout | — | src/crm/pages/CrmCategoriesPage.tsx |
| `/crm/moderation` | CrmModerationPage | CrmLayout | — | src/crm/pages/CrmModerationPage.tsx |
| `/crm/moderation/:id` | CrmModerationDetailPage | CrmLayout | — | src/crm/pages/CrmModerationDetailPage.tsx |
| `/crm/orders` | CrmOrdersPage | CrmLayout | — | src/crm/pages/CrmOrdersPage.tsx |
| `/crm/orders/:id` | CrmOrderDetailPage | CrmLayout | — | src/crm/pages/CrmOrderDetailPage.tsx |
| `/crm/fulfillment` | CrmFulfillmentPage | CrmLayout | — | src/crm/pages/CrmFulfillmentPage.tsx |
| `/crm/delivery` | CrmDeliveryPage | CrmLayout | — | src/crm/pages/CrmDeliveryPage.tsx |
| `/crm/regions` | CrmRegionsPage | CrmLayout | — | src/crm/pages/CrmRegionsPage.tsx |
| `/crm/payments` | CrmPaymentsPage | CrmLayout | — | src/crm/pages/CrmPaymentsPage.tsx |
| `/crm/payouts` | CrmPayoutsPage | CrmLayout | — | src/crm/pages/CrmPayoutsPage.tsx |
| `/crm/promotions` | CrmPromotionsPage | CrmLayout | — | src/crm/pages/CrmPromotionsPage.tsx |
| `/crm/coupons` | CrmCouponsPage | CrmLayout | — | src/crm/pages/CrmCouponsPage.tsx |
| `/crm/marketing` | CrmMarketingPage | CrmLayout | — | src/crm/pages/CrmMarketingPage.tsx |
| `/crm/templates` | CrmTemplatesPage | CrmLayout | — | src/crm/pages/CrmTemplatesPage.tsx |
| `/crm/users` | CrmUsersPage | CrmLayout | — | src/crm/pages/CrmUsersPage.tsx |
| `/crm/users/:id` | CrmUserDetailPage | CrmLayout | — | src/crm/pages/CrmUserDetailPage.tsx |
| `/crm/sellers` | CrmSellersPage | CrmLayout | — | src/crm/pages/CrmSellersPage.tsx |
| `/crm/sellers/:id` | CrmSellerDetailPage | CrmLayout | — | src/crm/pages/CrmSellerDetailPage.tsx |
| `/crm/reviews` | CrmReviewsPage | CrmLayout | — | src/crm/pages/CrmReviewsPage.tsx |
| `/crm/analytics` | CrmAnalyticsPage | CrmLayout | — | src/crm/pages/CrmAnalyticsPage.tsx |
| `/crm/tenants` | CrmTenantsPage | CrmLayout | — | src/crm/pages/CrmTenantsPage.tsx |
| `/crm/integrations` | CrmIntegrationsPage | CrmLayout | — | src/crm/pages/CrmIntegrationsPage.tsx |
| `/crm/settings` | CrmSettingsPage | CrmLayout | — | src/crm/pages/CrmSettingsPage.tsx |
| `*` | NotFound | — | — | src/pages/NotFound.tsx |

### 2.2 Per-route details (selected)

**ROUTE: /**  
- Path: `/`  
- Component: Index  
- File: src/pages/Index.tsx  
- Layout: None (full page with Header, Footer, MobileBottomNav)  
- Guard: None  
- Uses: Header, HeroSlider, ProductGrid, CategoryBanners, LookOfTheDay, InformBlock, SellersSection, MapSection, Footer, MobileBottomNav, PopularCategories, HotDeals, SpecialOffers, Bestsellers, TrendingProducts, CustomerReviews, CategorySliderSection, LightCategoryNav, CompactCategories, IconCategories, BrandStrip, GridCategories, FeaturedCategories, TrendingGrid, AnimatedStats, ProductShowcase, SellerSpotlight, MarketplaceAdvantages, VideoGallery, TestimonialsCarousel, FeatureTimeline, CategoriesMosaic, PromoBanner, RecentlyViewed, SocialFeed, SellerComparison, DealsCountdown, BrandShowcase, AiRecommendations, FaqAccordion, NewsletterBlock, MarketplaceCta, CinematicHero, SplitHero, LargeProductSlider, LookbookSlider, MinimalProductGrid, CategoryMosaic, CategoryCircleSlider, VideoCampaign, VideoProductCard, MiniVideoGallery, PromoVideoBanner, HeroProductPromo, HeroWithSlider, DailyDeals, FlashSale, ProductCollection, ProductComparison, ProductDiscovery, CategoryTabs, NewArrivals, FeaturedCollection, ProductFinderQuiz, DealDiscoveryQuiz, LightningDealQuiz, StyleMatchQuiz, GiftFinderQuiz, LifestyleGallery, TopRatedProducts, LimitedEdition, InfluencerPicks, CommunityFavorites, BundleDeals, ProductConfigurator, InteractiveProductCards, ProductHoverGrid, SplitVideoFeature, VideoProductStory, CombinedMediaBanner, LifestyleVideoStrip, DiscoveryMixedGrid, ShopTheLookGallery, MediaProductSlider, ProductDemoCards, TiltProductCards, ProductRotationShowcase, InteractiveLookbook, RandomModelShowcase, TrendingFashionShowcase, NewCollectionModels, SplitProductBanner, FullWidthPromoBanner, MultiProductBanner, DiscountPromoBanner, CategoryCtaBanner, VideoHeroBanner, SplitVideoBanner, VideoDemoBanner, VideoCarouselBanner, CinematicVideoBanner  
- API: None (all sections use mock/marketplaceData)  
- State: CartContext, FavoritesContext (via Header for counts)

**ROUTE: /product/:id**  
- Path: `/product/:id`  
- Component: ProductPage  
- File: src/pages/ProductPage.tsx  
- Uses: Header, Footer, MobileBottomNav, ProductCard, Button, ReviewModal  
- API: None. Data: mockProducts.find(p => p.id === Number(id))  
- State: CartContext (addToCart), FavoritesContext (toggleFavorite, isFavorite), AuthContext (isAuthenticated)

**ROUTE: /category/:slug**  
- Path: `/category/:slug`  
- Component: CategoryPage  
- File: src/pages/CategoryPage.tsx  
- Uses: Header, Footer, MobileBottomNav, ProductCard, Button  
- API: None. Data: mockProducts, mockCategories, mockSubcategories  
- State: Local only (sort, filters, pagination)

**ROUTE: /cart**  
- Path: `/cart`  
- Component: CartPage  
- File: src/pages/CartPage.tsx  
- Uses: Header, Footer, MobileBottomNav, Button  
- API: None  
- State: CartContext, AuthContext, FavoritesContext

**ROUTE: /favorites**  
- Path: `/favorites`  
- Component: FavoritesPage  
- File: src/pages/FavoritesPage.tsx  
- Uses: Header, Footer, MobileBottomNav, ProductCard, Button  
- State: AuthContext, FavoritesContext  

**ROUTE: /account/* (layout)**  
- Layout: AccountLayout — Header, Footer, MobileBottomNav, sidebar nav (Личные данные, Мои заказы, Способы оплаты, Баланс, Избранное, Купоны, Чеки, Реферальная программа, Смена пароля), user card from AuthContext  
- Guard: None (comment in App: "public, no auth redirect (demo mode)")  
- API: None (all child pages use mock data)

**ROUTE: /person/* (layout)**  
- Layout: PersonLayout — Header, Footer, MobileBottomNav, sidebar (sections: Основное, Управление, Настройки), LoginPromptProvider wrapping Outlet  
- Guard: None; LoginPromptProvider provides requireAuth(action) for actions that may need auth  
- API: None (mockOrders, mockUser, mockProducts, mockCoupons)

**ROUTE: /admin/* (guarded)**  
- Layout: AdminAuthProvider → AdminAuthGuard → AdminLayout (AdminSidebar, header with API health, parser status, logout)  
- Guard: AdminAuthGuard (redirects to /admin/login if not authenticated)  
- API: authApi, dashboardApi, parserApi, productsApi, categoriesApi, sellersApi, brandsApi, excludedApi, filtersApi, adminUsersApi, adminRolesApi, logsApi, settingsApi, systemApi, attributeRulesApi

**ROUTE: /crm/* (layout)**  
- Layout: CrmLayout — RbacProvider, TenantProvider, SidebarProvider, CrmSidebar, CrmTopbar  
- Guard: None (RBAC hides menu items by permission; no route-level guard)  
- API: None (CRM uses src/crm/data/mock-data.ts)

---

## 3. PAGE STRUCTURE

### 3.1 HOME (/)

- **Purpose:** Marketplace homepage with many content blocks (hero, categories, products, deals, quizzes, banners, etc.).  
- **UI sections:** Dozens of sections (see Index.tsx imports).  
- **Data sources:** mock-data (mockProducts), marketplaceData (popularCategories, hotDeals, bestsellers, trendingProducts, customerReviews, sellersData, promotions, etc.).  
- **API:** None.  
- **Reusable components:** All from components/sections, components/home, components/banners.

### 3.2 AUTH (/auth)

- **Purpose:** Login / register / recovery.  
- **UI:** Tabs (login/register/recovery), email/phone login tab, social buttons (VK, Google, Yandex, OK), password strength.  
- **Data:** useAuth().login / register with mock (sets isAuthenticated + mockUser).  
- **API:** None (AuthContext uses mockUser only).

### 3.3 CATEGORY (/category/:slug)

- **Purpose:** Category catalog with filters (price, size, color, brand, material), sort, grid/list view, pagination.  
- **Data:** mockProducts, mockCategories, mockSubcategories.  
- **API:** None. Filters and pagination are client-side only.

### 3.4 PRODUCT (/product/:id)

- **Purpose:** Product detail: gallery, title, rating, price, color/size pickers, quantity, add to cart, favorite, tabs (about/reviews/delivery), similar products, recently viewed, buy together, reviews list, ReviewModal.  
- **Data:** mockProducts; similar/recent/buyTogether derived by slice/filter.  
- **API:** None.  
- **State:** CartContext, FavoritesContext, AuthContext.

### 3.5 CART (/cart)

- **Purpose:** Cart list (image, title, seller, color/size, quantity, remove), delivery threshold, totals, checkout CTA.  
- **Data:** CartContext.items (Product from mock-data shape).  
- **API:** None.

### 3.6 FAVORITES (/favorites)

- **Purpose:** Favorites grid or login prompt.  
- **Data:** FavoritesContext.favorites.  
- **API:** None.

### 3.7 BRANDS (/brand, /brand/:slug)

- **Purpose:** List brands; brand page with hero, about, certificates, product grid.  
- **Data:** brandsData (marketplaceData), mockProducts for brand products.  
- **API:** None.

### 3.8 SELLERS (/seller, /seller/:id)

- **Purpose:** List sellers; seller page with avatar, rating, trust metrics, product grid.  
- **Data:** sellersData (marketplaceData), mockProducts for seller products.  
- **API:** None.

### 3.9 ACCOUNT (/account/*)

- **Purpose:** User cabinet: personal data, orders, payment methods, balance, favorites, coupons, receipts, referral, password.  
- **Data:** mockUser, mockOrders, mockCoupons, mockReceipts, mockBalanceHistory.  
- **API:** None.  
- **Pages:** PersonalDataPage, OrdersPage, PaymentMethodsPage, BalancePage, FavoritesPage (same as /favorites), CouponsPage, ReceiptsPage, ReferralPage, ChangePasswordPage.

### 3.10 PERSON (/person/*)

- **Purpose:** Alternative user cabinet with more sections: dashboard, profile, orders, order detail, payments, password, returns, favorites, viewed, addresses, subscriptions, coupons, notifications, support, security, settings.  
- **Data:** mockUser, mockOrders, mockProducts, mockCoupons; PersonDashboard aggregates them.  
- **API:** None.  
- **Note:** LoginPromptProvider used for requireAuth(action) on some actions; no route guard.

### 3.11 INFORMATIONAL PAGES

- **Paths:** /how-to-order, /payment, /delivery, /returns, /faq, /sell, /rules, /commission, /seller-help, /about, /contacts, /careers, /blog  
- **Purpose:** Static/content pages.  
- **Implementation:** Use InfoPageShared (PageHero, CtaBlock, etc.) and/or custom content.  
- **Data:** No API; static or local content.

### 3.12 CONSTRUCTOR (/constructor, /constructor/*)

- **Purpose:** Visual page builder: drag blocks, templates, canvas, device preview, undo/redo, save template to localStorage.  
- **Data:** useConstructorStore (blocks, templates in localStorage).  
- **API:** None. Layouts are not sent to backend.

### 3.13 ADMIN PAGES (summary)

- **Dashboard:** dashboardApi, parserApi, systemApi, logsApi; useParserChannel for live updates.  
- **Parser:** parserApi (status, start/stop, options), categoriesApi, logsApi; SSE progress.  
- **Products/Categories/Sellers/Brands/Filters/Excluded/Logs/Settings/Attribute rules/Users/Roles:** Corresponding api modules from @/lib/api.  
- **Ai/Scheduler:** admin mock-data (mockAiConfig, mockSchedulerTasks); no backend API used.

### 3.14 CRM PAGES (summary)

- **All CRM pages:** Use CRM mock data (src/crm/data/mock-data.ts: dashboardKpis, salesChartData, crmOrders, topProducts, crmUsers, crmSellers, crmProducts, crmCategories, crmReviews, crmPromotions, etc.). No API calls.  
- **Layout:** CrmSidebar (permission-based nav), CrmTopbar, RbacProvider, TenantProvider.

---

## 4. COMPONENT ARCHITECTURE

### 4.1 Layout / shell

- **Header** (src/components/Header.tsx): Fixed top bar; cart/favorites counts from context; search; categories dropdown (MegaMenu); currency/city selectors; nav links. Uses CartContext, FavoritesContext.  
- **Footer** (src/components/Footer.tsx): Links, socials, copyright.  
- **MobileBottomNav** (src/components/MobileBottomNav.tsx): Bottom navigation for mobile.  
- **PageTransition** (src/components/PageTransition.tsx): Wraps route content for AnimatePresence.  
- **ScrollToTop** (src/components/ScrollToTop.tsx): Scroll to top on route change.

### 4.2 Reusable UI (business)

- **ProductCard** (src/components/ProductCard.tsx): Props: `product` (id, name, price, oldPrice, images, rating, reviews, seller), `variant?: "grid" | "list"`. Renders image carousel, discount badge, price, rating, seller, favorite button, add to cart. Uses local state for favorite (does not use FavoritesContext). Links to `/product/${product.id}`.  
- **ProductGrid** (src/components/ProductGrid.tsx): Props: title, subtitle?, initialCount?. Generates products internally (generateProducts from local image set); loadMore with timeout. Uses ProductCard, useDragScroll. No API.  
- **BrandLogo** (src/components/BrandLogo.tsx): Brand logo display.  
- **SellersSection** (src/components/SellersSection.tsx): Sellers block (uses marketplaceData/sellersData).  
- **InfoPageShared** (src/components/InfoPageShared.tsx): PageHero, CtaBlock for info pages; useScrollAnimation.

### 4.3 Sections (src/components/sections)

- **Product blocks:** Bestsellers, TrendingProducts, HotDeals, DailyDeals, FlashSale, NewArrivals, LargeProductSlider, MinimalProductGrid, ProductShowcase, ProductDiscovery, ProductComparison, CategoryTabs, FeaturedCollection, ProductCollection, MediaProductSlider, etc. Most use mockProducts or marketplaceData (bestsellers, hotDeals, trendingProducts, etc.).  
- **Category blocks:** PopularCategories, FeaturedCategories, CategorySliderSection, CategoryCircleSlider, CategoryMosaic, CategoriesMosaic, AllCategoriesGrid, CompactCategories, IconCategories, GridCategories (home variants). Data: popularCategories (marketplaceData) or mockCategories.  
- **Banners / promo:** PromoBanner, SplitProductBanner, VideoCarouselBanner, VideoHeroBanner, etc. (see banners/).  
- **Social / trust:** CustomerReviews, TestimonialsCarousel, SellerSpotlight, SellerComparison, TrustBadges, Newsletter, NewsletterBlock, MarketplaceCta, MarketplaceAdvantages.  
- **Quizzes:** ProductFinderQuiz, DealDiscoveryQuiz, LightningDealQuiz, StyleMatchQuiz, GiftFinderQuiz.  
- **Model showcase:** RandomModelShowcase, TrendingFashionShowcase, NewCollectionModels (modelData, modelVideoData).  
- **Other:** RecentlyViewed (mockProducts), AiRecommendations (mockProducts), FaqAccordion, HowToOrder, InformBlock, MapSection, etc.

### 4.4 Banners (src/components/banners)

- SplitProductBanner, VideoCarouselBanner, VideoHeroBanner, SplitVideoBanner, VideoDemoBanner, FullWidthPromoBanner, MultiProductBanner, DiscountPromoBanner, CategoryCtaBanner, CinematicVideoBanner.  
- Used on home and in constructor block library.

### 4.5 Home variants (src/components/home)

- LightCategoryNav, CategorySliderSection, CategoryVariants (BrandStrip, CompactCategories, IconCategories, GridCategories).  
- Data: popularCategories (marketplaceData).

### 4.6 UI primitives (src/components/ui)

- shadcn-style: button, dialog, toaster, sonner, tooltip, tabs, sidebar, carousel, select, input, skeleton, etc.  
- Used across app and admin/CRM.

### 4.7 Constructor components

- **ConstructorPage:** TopBar, BlockLibrary, Canvas, SettingsPanel, TemplatesPanel.  
- **BlockLibrary:** blockRegistry categories; onAddBlock.  
- **Canvas:** Renders blocks via blockRenderer; reorder, select, drop.  
- **SettingsPanel:** Selected block settings; update/remove/duplicate/visibility.  
- **TemplatesPanel:** Load/delete templates from store.  
- **blockRenderer:** Maps block type to section component (same as home sections).  
- **blockRegistry:** Defines block types (hero, products, categories, banners, video, quiz, cta, etc.) with defaultSettings.

### 4.8 Admin components

- AdminLayout, AdminSidebar, AdminAuthGuard; SellerHeader, SellerProductsTable; various tables and forms. Use api.ts and React Query where applicable.

### 4.9 CRM components

- CrmLayout, CrmSidebar, CrmTopbar; StatCard, PageHeader, DataTable, StatusBadge; RbacContext, TenantProvider. No API usage.

---

## 5. STATE MANAGEMENT

### 5.1 AuthContext (src/contexts/AuthContext.tsx)

- **Stores:** isAuthenticated (boolean), user (UserProfile | null).  
- **Actions:** login(email, password), register(name, email, phone, password), logout().  
- **Implementation:** login/register set isAuthenticated true and user to mockUser (or derived); logout clears. No API.  
- **Usage:** AuthPage, AccountLayout, PersonLayout, FavoritesPage, CartPage, ProductPage, Header (indirect), LoginPromptProvider.

### 5.2 CartContext (src/contexts/CartContext.tsx)

- **Stores:** items (CartItem[]). CartItem: { product: Product, quantity, color, size }. Product from @/data/mock-data.  
- **Actions:** addToCart(product, color, size), removeFromCart(productId), updateQuantity, updateColor, updateSize, clearCart.  
- **Derived:** totalItems, totalPrice, totalDiscount (from product.price / oldPrice).  
- **Persistence:** In-memory only.  
- **Usage:** ProductPage, CartPage, Header (totalItems), ProductCard (if wired).

### 5.3 FavoritesContext (src/contexts/FavoritesContext.tsx)

- **Stores:** favorites (Product[] from mock-data).  
- **Actions:** toggleFavorite(product), isFavorite(productId), count.  
- **Persistence:** In-memory only.  
- **Usage:** FavoritesPage, ProductPage, Header (count).

### 5.4 LoginPromptContext (src/contexts/LoginPromptContext.tsx)

- **Stores:** Modal open state, actionLabel.  
- **API:** requireAuth(action?: string): boolean — if not isAuthenticated opens modal and returns false; else true.  
- **Usage:** Wraps PersonLayout outlet; PersonOrders (e.g. requireAuth for actions).  
- **Note:** LoginPromptProvider receives isAuthenticated from parent (PersonLayout uses AuthContext).

### 5.5 AdminAuthContext (src/admin/contexts/AdminAuthContext.tsx)

- **Stores:** user (AdminUser | null), isLoading.  
- **Actions:** login(email, password) → authApi.login, stores token in localStorage.admin_token, refreshUser (authApi.me), logout (clear token, redirect /admin/login).  
- **Integration:** setOnUnauthorized(logout) in api.ts so 401 on admin routes triggers logout.  
- **Usage:** Admin layout, AdminAuthGuard, AdminLoginPage.

### 5.6 CRM: RbacContext, TenantContext

- **RbacContext:** Permission checks (hasPermission, hasAnyPermission) for CRM sidebar and features.  
- **TenantContext:** Tenant/multi-tenancy for CRM.  
- **Usage:** CrmSidebar (nav visibility), CRM pages as needed.

### 5.7 Constructor store (src/constructor/useConstructorStore.ts)

- **Stores:** blocks (BlockConfig[]), selectedBlockId, deviceMode, previewMode, templates (PageTemplate[] from localStorage).  
- **Actions:** addBlock, removeBlock, moveBlock, duplicateBlock, toggleBlockVisibility, updateBlockSettings, reorderBlocks, undo, redo, saveTemplate, loadTemplate, deleteTemplate.  
- **Persistence:** templates in localStorage key `constructor_templates`.  
- **Usage:** ConstructorPage only.

### 5.8 Provider tree (App.tsx)

```
QueryClientProvider
  → AuthProvider
    → CartProvider
      → FavoritesProvider
        → TooltipProvider
          → Toaster, Sonner
          → BrowserRouter
            → ScrollToTop, AnimatedRoutes
```

Admin: AdminAuthProvider wraps /admin routes; AdminAuthGuard wraps AdminLayout and children.  
Person: LoginPromptProvider wraps PersonLayout outlet.

---

## 6. API INTEGRATION

### 6.1 API client (src/lib/api.ts)

- **Base URL:** Resolved from VITE_API_URL; default `https://online-parser.siteaacess.store/api/v1`. Production build disallows local/LAN; HTTPS enforced when page is HTTPS.  
- **Auth:** All non-public requests send `Authorization: Bearer ${localStorage.admin_token}`.  
- **401:** If path starts with /admin, calls setOnUnauthorized (AdminAuthContext logout).  
- **Helpers:** get, post, put, patch, del; request<T>(method, path, body?, isPublic).

### 6.2 API modules and endpoints

| Module | Endpoints (method, path) | Used by |
|--------|--------------------------|--------|
| authApi | POST /auth/login, GET /auth/me, POST /auth/refresh, logout (local) | AdminAuthContext |
| dashboardApi | GET /dashboard | DashboardPage |
| systemApi | GET /system/status | DocsPage (admin) |
| parserApi | GET /parser/status, /parser/state, /parser/settings, /parser/stats, /parser/diagnostics, /parser/health, /parser/progress-overview, POST /parser/start, /parser/start-daemon, /parser/stop, /parser/stop-daemon, /parser/pause, /parser/restart, /parser/queue-clear, /parser/queue-flush, /parser/queue-restart, /parser/clear-failed, GET /parser/failed-jobs, POST /parser/retry-job/:id, /parser/kill-stuck, /parser/release-lock, /parser/reset, GET /parser/jobs, /parser/jobs/:id, POST /parser/photos/download, POST /parser/categories/sync, progressUrl/progressStream (SSE) | ParserPage, AdminLayout, AdminAuthContext (categoriesSync on login) |
| productsApi | GET/PATCH/DELETE /products, POST /products/bulk | ProductsPage, ProductDetailPage |
| categoriesApi | GET /categories, GET /categories/:id, PATCH /categories/:id, POST /categories/reorder, GET /categories/:id/filters | CategoriesPage, ParserPage, FiltersPage, BrandsPage, SellerProductsTable |
| sellersApi | GET /sellers, GET /sellers/:idOrSlug, GET /sellers/:idOrSlug/products, PATCH /sellers/:id | SellersPage, SellerDetailPage, SellerProductsTable, ProductsPage |
| brandsApi | GET /brands, GET/POST/PUT/DELETE /brands/:id | BrandsPage |
| excludedApi | GET/POST/PUT/DELETE /excluded, POST /excluded/test | ExcludedPage |
| filtersApi | GET/POST/PUT/DELETE /filters, GET /filters/:categoryId/values | FiltersPage |
| adminUsersApi | GET/POST/PUT/DELETE /admin/users | UsersPage |
| adminRolesApi | GET/POST/PUT/DELETE /admin/roles | RolesPage |
| logsApi | GET /logs, DELETE /logs/clear | LogsPage, DashboardPage |
| settingsApi | GET/PUT /settings, PUT /settings/:key | SettingsPage |
| attributeRulesApi | list, create, update, remove, test, rebuild, audit, synonyms, dictionary, canonical, facets | AttributeRulesPage |
| publicApi | GET /public/menu, GET /public/categories/:slug/products, GET /public/products/:externalId, GET /public/sellers/:slug, GET /public/search, GET /public/featured | **Not used by any component** |
| healthApi | GET {base}/up | AdminLayout |

### 6.3 PAGE → API → DATA FLOW (where API is used)

| Page | API | Data flow |
|------|-----|-----------|
| Admin Login | authApi.login | email, password → token stored; authApi.me on refresh |
| Admin Dashboard | dashboardApi.get, parserApi.status, systemApi.status, logsApi.list | React Query; useParserChannel invalidates parser/dashboard |
| Admin Parser | parserApi.*, categoriesApi.list, logsApi | Start/stop/options; SSE progress; category sync |
| Admin Products | productsApi.list, get, update, delete, bulk; categoriesApi, sellersApi | Filters, pagination, edit |
| Admin ProductDetail | productsApi.get, update | Load by id, patch |
| Admin Categories | categoriesApi, parserApi | Tree, reorder, parser link |
| Admin Sellers | sellersApi.list, get, products | List, detail, seller products table |
| Admin SellerDetail | sellersApi.get, products | |
| Admin Brands | brandsApi, categoriesApi | |
| Admin Filters | filtersApi, categoriesApi | |
| Admin Excluded | excludedApi | |
| Admin Logs | logsApi | |
| Admin Settings | settingsApi | |
| Admin Users/Roles | adminUsersApi, adminRolesApi | |
| Admin AttributeRules | attributeRulesApi | |
| Admin Docs | systemApi.status | |
| Admin Layout | healthApi.check, parserApi.status, useParserChannel | Header health + parser status |
| Public/Account/Person/CRM | — | Mock data only; publicApi never called |

### 6.4 WebSocket / SSE

- **Laravel Echo** (src/lib/echo.ts): Used by useParserChannel.  
- **useParserChannel** (src/hooks/useParserChannel.ts): Subscribes to channel `parser`, listens for ParserStarted, ParserProgressUpdated, ProductParsed, ParserFinished, ParserError; invalidates React Query keys: parser-status, parser-status-header, parser-stats, dashboard, logs.  
- **Parser SSE:** parserApi.progressUrl(jobId) and progressStream(jobId) for progress when Echo not available.

---

## 7. DOMAIN MODEL

### 7.1 Entities (frontend perspective)

- **User (customer):** mock-data UserProfile (name, email, phone, birthday, avatar, balance, referralCode, addresses, pvzAddresses). No backend entity in use on frontend.  
- **Seller:** In mock: marketplaceData sellersData (id, name, slug, avatar, rating, reviewCount, productCount, etc.). In API: Seller / SellerFull (id, slug, name, pavilion, status, is_verified, products_count, contacts, etc.). Public pages use sellersData only.  
- **Product:** Two shapes: (1) mock-data Product (id, name, price, oldPrice, images, rating, reviews, seller string, category string, colors, sizes, etc.); (2) api.ts Product/ProductFull (id, external_id, title, price string, category/seller objects, photos, attributes, brand, etc.). Cart and Favorites use mock-data Product. Public catalog uses mock only.  
- **Category:** mock: mockCategories (string names), mockSubcategories, marketplaceData popularCategories (slug, name, count, image). API: Category (id, slug, name, parent_id, products_count, parser settings, etc.). Public uses mock/marketplaceData.  
- **Brand:** marketplaceData brandsData (name, slug, logo, description, productCount, history, advantages, certificates). API: Brand (id, name, slug, logo_url, status, category_ids). Public uses brandsData only.  
- **Order:** mock-data Order (id, date, status, total, discount, delivery, items, address, payment). No order API on frontend.  
- **Cart:** In-memory CartContext; items are { product, quantity, color, size }. No cart API.  
- **Favorites:** In-memory FavoritesContext; array of Product. No favorites API.  
- **Payments / Coupons / Receipts / Balance:** Mock only (mockUser.balance, mockBalanceHistory, mockCoupons, mockReceipts).

### 7.2 Relationships (as used in frontend)

- Product → category (string or object), seller (string or object), brand (optional).  
- Order → items[] → product, quantity, color, size.  
- Cart/Favorites → Product (mock shape).  
- Admin: Category tree (parent_id), Product ↔ Category/Seller, Seller → products.

### 7.3 Missing or unused backend expectations

- **Public API unused:** publicApi.menu, categoryProducts, product, seller, search, featured are never called. Frontend does not load real categories, products, or sellers from backend on marketplace pages.  
- **No customer auth API:** Login/register are mock only.  
- **No order/cart/favorites API:** No checkout, no order creation, no sync of cart or favorites to backend.  
- **No user profile/addresses/payment methods API:** Account and Person use mock only.

---

## 8. ADMIN / CRM STRUCTURE

### 8.1 Admin responsibilities (current)

- **Parser:** Start/stop/pause/restart, options (full/menu_only/category/seller, categories, products_per_category, save_photos, etc.), category sync, SSE/WebSocket progress, diagnostics, failed jobs, queue clear, photo download.  
- **Catalog:** Products (CRUD, bulk hide/delete/publish), categories (tree, reorder, parser link), sellers (list, detail, products), brands (CRUD).  
- **Content/rules:** Excluded rules (text rules), filters config per category, attribute rules (normalization, synonyms, dictionary, canonical, facets).  
- **System:** Logs, settings, dashboard (products/categories/sellers/parser stats, system status).  
- **Users:** Admin users and roles (CRUD).  
- **AI / Scheduler:** UI only; use admin mock-data (no backend).

### 8.2 Admin auth and layout

- AdminAuthProvider: login via authApi, token in localStorage, 401 → logout and redirect to /admin/login.  
- AdminAuthGuard: wraps all /admin routes except login; redirects unauthenticated to /admin/login.  
- AdminLayout: sidebar (AdminSidebar), header (health, parser status, user, logout), Outlet.

### 8.3 CRM responsibilities (current)

- **Designed for:** Content, notifications, products, categories, moderation, orders, fulfillment, delivery, regions, payments, payouts, promotions, coupons, marketing, templates, users, sellers, reviews, analytics, tenants, integrations, settings.  
- **Implementation:** All CRM pages use mock data from src/crm/data/mock-data.ts (dashboardKpis, salesChartData, crmOrders, topProducts, crmUsers, crmSellers, crmProducts, crmCategories, crmReviews, crmPromotions, etc.). No API integration.  
- **RBAC:** CrmSidebar items have permission (e.g. content.manage, products.read, orders.read, finance.view). RbacContext used to hide nav; no route guard.  
- **Tenant:** TenantProvider for multi-tenant context; no backend.

### 8.4 Admin vs CRM

- **Admin:** Backend-connected; parser and catalog management; real auth and API.  
- **CRM:** UI shell and permission-based nav; all data mock; suitable for future backend wiring (orders, sellers, moderation, finance, etc.).

---

## 9. CONSTRUCTOR SYSTEM

### 9.1 What the constructor does

- **Visual page builder** at /constructor and /constructor/*.  
- **Blocks:** Dragged from BlockLibrary (from blockRegistry). Categories: hero, products, categories, banners, video, gallery, lookbook, quiz, cta, text, social, navigation, footer.  
- **Canvas:** Renders blocks via blockRenderer (maps type to section component, e.g. Bestsellers, HeroWithSlider). Reorder (drag), select, duplicate, remove, visibility toggle.  
- **Templates:** Save current blocks as named template; load/delete. Stored in **localStorage** key `constructor_templates`.  
- **Device mode:** desktop/tablet/mobile. Preview mode hides panels.  
- **Undo/redo:** History in memory (MAX_HISTORY 50).  
- **No backend:** Layouts and templates are not sent to or loaded from server.

### 9.2 Block registry and renderer

- **blockRegistry** (src/constructor/blockRegistry.ts): ~70+ block types with category, label, icon, defaultSettings.  
- **blockRenderer** (src/constructor/blockRenderer.tsx): Maps block type to React component (same section components as home).  
- **SettingsPanel:** Edits selected block’s settings (block.settings); no persistence beyond current session except via templates.

### 9.3 How constructor could control home/category/landing

- **Current:** Constructor does not control any live page. It only edits a local canvas and saves to localStorage.  
- **Possible evolution:** (1) Backend store for “page layouts” (e.g. home, category slug, landing slug). (2) Constructor saves layout to backend with page key. (3) Frontend home/category/landing fetches layout by key and renders blocks (same blockRenderer). (4) Block “data source” settings (e.g. category slug, product count) could drive publicApi.categoryProducts/product calls.  
- **Today:** Home page is hardcoded in Index.tsx (fixed list of sections). Category page is CategoryPage.tsx (no constructor-driven layout). No dynamic landing routes.

---

## 10. PROBLEMS AND TECH DEBT

### 10.1 Dead / unused

- **publicApi** in api.ts is never used. All public catalog (home, category, product, brand, seller) uses mock data.  
- **FavoritesPage** is mounted at both /favorites and /account/favorites (same component, no difference).  
- **ProductCard** keeps local `isFavorite` state and does not sync with FavoritesContext (inconsistent UX if FavoritesContext is used elsewhere for same product).

### 10.2 Duplication: /account vs /person

- **Two cabinets:** /account (9 sub-routes) and /person (18 sub-routes) both represent “user cabinet.”  
- **Overlap:** Orders, favorites, coupons, password, payment-related (account: payment/balance; person: payments). Both use same mock data (mockUser, mockOrders, mockCoupons).  
- **Differences:** Account has balance, receipts, referral; Person has dashboard, profile, returns, viewed, addresses, subscriptions, notifications, support, security, settings. Person has LoginPromptProvider and requireAuth for some actions; Account has no auth guard.  
- **Recommendation:** Choose one cabinet as canonical (e.g. Person for fuller feature set and UX) and migrate Account routes into it or deprecate Account; remove duplicate routes and consolidate nav. Document “demo mode” and add real auth when backend is ready.

### 10.3 Data and type inconsistency

- **Two Product types:** mock-data Product (id, name, price, images, seller string, etc.) vs api.ts Product (external_id, title, price string, category/seller objects). CartContext and FavoritesContext use mock-data Product. Switching public pages to publicApi would require adapter or unified type.  
- **Category:** mock uses string names and marketplaceData shapes; API uses id, slug, parent_id, products_count. Same for Seller/Brand.  
- **Cart:** Uses product.id (number) and mock Product; backend might use external_id for public product URLs.

### 10.4 No real customer backend

- Auth is mock; no JWT or session for customers.  
- No order creation, no cart/favorites persistence, no user profile/addresses APIs.  
- Public API exists but is unused — frontend is not “connected” to backend for marketplace data.

### 10.5 CRM not connected

- CRM is full UI with RBAC and tenants but no API. All data from crm/data/mock-data. Backend for orders, sellers, moderation, payments, etc. must be defined and wired.

### 10.6 Constructor not connected

- Layouts live only in localStorage. No multi-user or server-side pages; no way to “publish” a constructor layout to home or category.

### 10.7 Scaling and performance

- **Index.tsx:** Imports and renders a very large number of sections (50+). No lazy loading of sections or code-splitting per block.  
- **No lazy routes:** All pages are synchronous imports in App.tsx; larger bundles.  
- **Admin:** React Query and WebSocket used appropriately; parser and dashboard scale reasonably.

### 10.8 Security / hardening

- Admin token in localStorage (XSS risk); consider httpOnly cookie for refresh.  
- No CSRF mentioned for admin API.  
- CRM has no route-level auth; only sidebar hidden by permission.

### 10.9 Other

- **Admin “НЕ ТРОГАТЬ” comment:** Indicates parser is critical; changes to admin auth/parser should be careful.  
- **Person “без авторизации”:** No redirect for unauthenticated users; demo-friendly but inconsistent with “requireAuth” on some actions.  
- **Link vs useNavigate:** Some places use `<a href>` (e.g. ProductCard, CartPage) instead of React Router Link/navigate (full reload possible).

---

## 11. ARCHITECTURAL RECOMMENDATIONS

1. **Connect public marketplace to backend:** Use publicApi.menu for nav/categories, publicApi.categoryProducts for category page, publicApi.product for product page (by external_id), publicApi.seller for seller page. Introduce a single Product (and Category/Seller) shape or adapter from API to current UI.  
2. **Unify customer cabinet:** Keep one cabinet (e.g. Person), move Account-only features (balance, receipts, referral) into it, remove /account or redirect to /person. Add real auth and guard when backend is ready.  
3. **Sync cart/favorites with backend:** When user APIs exist, persist cart and favorites; keep CartContext/FavoritesContext but hydrate from API and persist changes.  
4. **Use one Product type:** Prefer API shape for catalog and add adapter for Cart/Favorites (e.g. map external_id ↔ id, title ↔ name) or refactor contexts to use API type.  
5. **Lazy load home sections:** Dynamic or lazy load sections on Index to reduce initial bundle and allow constructor-driven home later.  
6. **Lazy load routes:** Use React.lazy and Suspense for page components to split bundles (especially admin, CRM, constructor).  
7. **Constructor backend:** Add API to save/load layouts by page key; have home (and optionally category/landing) fetch layout and render via blockRenderer.  
8. **CRM backend:** Define and implement APIs for orders, sellers, moderation, payments, etc., and replace CRM mock data with API calls.  
9. **Replace `<a href>` with React Router:** Use Link or useNavigate for in-app navigation to avoid full reloads.  
10. **ProductCard and Favorites:** Either wire ProductCard to FavoritesContext.toggleFavorite/isFavorite or remove duplicate local favorite state.

---

## BACKEND INFORMATION REQUIRED

To fully align frontend with backend and complete marketplace and CRM flows, the following need clarification:

1. **Public API:** Are GET /public/menu, /public/categories/:slug/products, /public/products/:externalId, /public/sellers/:slug, /public/search, /public/featured implemented and stable? What are exact response shapes (pagination, filters)?  
2. **Customer auth:** Is there a customer login/register/refresh API? Token type (JWT, cookie)? How should frontend send token (header, cookie)?  
3. **Orders:** How is order creation done (from cart)? Endpoints for list/detail/status?  
4. **Cart:** Is there a cart API (get, add, update, remove) keyed by user or session?  
5. **Favorites:** Is there a favorites/list API for the logged-in user?  
6. **User profile:** Endpoints for profile, addresses, payment methods, balance, receipts, referral, subscriptions, notifications?  
7. **Product URL:** Should public product URLs use internal id or external_id (e.g. /product/:externalId)?  
8. **CRM:** Which CRM entities have backend APIs (orders, users, sellers, moderation, payments, payouts, promotions, analytics)? Permission model (roles/permissions) and tenant model?  
9. **Constructor:** Is there or will there be an API to store and retrieve page layouts (e.g. by route or page key)?  
10. **Categories:** Is category tree and menu fully provided by /public/menu or /categories? Any frontend-only category structure to migrate?

---

*End of Frontend Marketplace Architecture Audit.*
