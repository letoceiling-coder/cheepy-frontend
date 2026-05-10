import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { BASE_URL, publicApi, type MarketplaceContact, type PublicMarketplaceSettings } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import BrandPage from "./pages/BrandPage";
import BrandsListPage from "./pages/BrandsListPage";
import SellerPage from "./pages/SellerPage";
import SellersListPage from "./pages/SellersListPage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import FavoritesPage from "./pages/FavoritesPage";
import CartPage from "./pages/CartPage";
import AccountLayout from "./pages/account/AccountLayout";
import PersonalDataPage from "./pages/account/PersonalDataPage";
import OrdersPage from "./pages/account/OrdersPage";
import PaymentMethodsPage from "./pages/account/PaymentMethodsPage";
import BalancePage from "./pages/account/BalancePage";
import CouponsPage from "./pages/account/CouponsPage";
import ReceiptsPage from "./pages/account/ReceiptsPage";
import ReferralPage from "./pages/account/ReferralPage";
import ChangePasswordPage from "./pages/account/ChangePasswordPage";
import PreferencesPage from "./pages/account/PreferencesPage";
import RequireAccountAuth from "./pages/account/RequireAccountAuth";
import PersonLayout from "./pages/person/PersonLayout";
import PersonDashboard from "./pages/person/PersonDashboard";
import PersonProfile from "./pages/person/PersonProfile";
import PersonOrders from "./pages/person/PersonOrders";
import PersonOrderDetail from "./pages/person/PersonOrderDetail";
import PersonPayments from "./pages/person/PersonPayments";
import PersonPassword from "./pages/person/PersonPassword";
import PersonReturns from "./pages/person/PersonReturns";
import PersonFavorites from "./pages/person/PersonFavorites";
import PersonRecentlyViewed from "./pages/person/PersonRecentlyViewed";
import PersonAddresses from "./pages/person/PersonAddresses";
import PersonSubscriptions from "./pages/person/PersonSubscriptions";
import PersonCoupons from "./pages/person/PersonCoupons";
import PersonNotifications from "./pages/person/PersonNotifications";
import PersonSupport from "./pages/person/PersonSupport";
import PersonSecurity from "./pages/person/PersonSecurity";
import PersonSettings from "./pages/person/PersonSettings";
import HowToOrderPage from "./pages/info/HowToOrderPage";
import PaymentInfoPage from "./pages/info/PaymentInfoPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailPage from "./pages/PaymentFailPage";
import DeliveryPage from "./pages/info/DeliveryPage";
import ReturnsPage from "./pages/info/ReturnsPage";
import FaqPage from "./pages/info/FaqPage";
import SellPage from "./pages/info/SellPage";
import RulesPage from "./pages/info/RulesPage";
import CommissionPage from "./pages/info/CommissionPage";
import SellerHelpPage from "./pages/info/SellerHelpPage";
import AboutPage from "./pages/info/AboutPage";
import ContactsPage from "./pages/info/ContactsPage";
import CareersPage from "./pages/info/CareersPage";
import BlogPage from "./pages/info/BlogPage";
import CmsDynamicPage from "./pages/CmsDynamicPage";
import ConstructorPage from "./constructor/pages/ConstructorPage";
import { AdminLayout } from "./admin/components/AdminLayout";
import { AdminAuthGuard } from "./admin/components/AdminAuthGuard";
import SystemAuthGuard from "./admin/components/SystemAuthGuard";
import { AdminAuthProvider } from "./admin/contexts/AdminAuthContext";
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import DashboardPage from "./admin/pages/DashboardPage";
import ParserPage from "./admin/pages/ParserPage";
import ProductsPage from "./admin/pages/ProductsPage";
import ProductDetailPage from "./admin/pages/ProductDetailPage";
import CategoriesPage from "./admin/pages/CategoriesPage";
import SellersPage from "./admin/pages/SellersPage";
import SellerDetailPage from "./admin/pages/SellerDetailPage";
import BrandsPage from "./admin/pages/BrandsPage";
import FiltersPage from "./admin/pages/FiltersPage";
import AiPage from "./admin/pages/AiPage";
import SchedulerPage from "./admin/pages/SchedulerPage";
import ExcludedPage from "./admin/pages/ExcludedPage";
import LogsPage from "./admin/pages/LogsPage";
import DocsPage from "./admin/pages/DocsPage";
import UsersPage from "./admin/pages/UsersPage";
import RolesPage from "./admin/pages/RolesPage";
import SettingsPage from "./admin/pages/SettingsPage";
import AttributeRulesPage from "./admin/pages/AttributeRulesPage";
import { CrmLayout } from "./crm/layout/CrmLayout";
import CrmAuthGuard from "@/crm/layout/CrmAuthGuard";
import CrmDashboardPage from "./crm/pages/CrmDashboardPage";
import CrmGenerateDescriptionPage from "./crm/pages/CrmGenerateDescriptionPage";
import CrmContentPage from "./crm/pages/CrmContentPage";
import CrmProductsPage from "./crm/pages/CrmProductsPage";
import CrmCategoriesPage from "./crm/pages/CrmCategoriesPage";
import CrmOrdersPage from "./crm/pages/CrmOrdersPage";
import CrmUsersPage from "./crm/pages/CrmUsersPage";
import CrmSellersPage from "./crm/pages/CrmSellersPage";
import CrmAnalyticsPage from "./crm/pages/CrmAnalyticsPage";
import CrmPromotionsPage from "./crm/pages/CrmPromotionsPage";
import CrmReviewsPage from "./crm/pages/CrmReviewsPage";
import CrmSettingsPage from "./crm/pages/CrmSettingsPage";
import CrmModerationPage from "./crm/pages/CrmModerationPage";
import CrmMediaPage from "./crm/pages/CrmMediaPage";
import CrmFulfillmentPage from "./crm/pages/CrmFulfillmentPage";
import CrmPaymentsPage from "./crm/pages/CrmPaymentsPage";
import CrmPayoutsPage from "./crm/pages/CrmPayoutsPage";
import CrmDeliveryPage from "./crm/pages/CrmDeliveryPage";
import CrmRegionsPage from "./crm/pages/CrmRegionsPage";
import CrmCouponsPage from "./crm/pages/CrmCouponsPage";
import CrmBonusRulesPage from "./crm/pages/CrmBonusRulesPage";
import CrmMarketingPage from "./crm/pages/CrmMarketingPage";
import CrmMarketingNewsPage from "./crm/pages/CrmMarketingNewsPage";
import CrmTemplatesPage from "./crm/pages/CrmTemplatesPage";
import CrmNotificationsPage from "./crm/pages/CrmNotificationsPage";
import CrmIntegrationsPage from "./crm/pages/CrmIntegrationsPage";
import CrmWebhookLogsPage from "./crm/pages/CrmWebhookLogsPage";
import CrmProviderDetailPage from "./crm/pages/CrmProviderDetailPage";
import CrmDeliveryIntegrationPage from "./crm/pages/CrmDeliveryIntegrationPage";
import CrmMapsIntegrationPage from "./crm/pages/CrmMapsIntegrationPage";
import CrmSmsIntegrationPage from "./crm/pages/CrmSmsIntegrationPage";
import CrmMailIntegrationPage from "./crm/pages/CrmMailIntegrationPage";
import CrmSocialOauthIntegrationPage from "./crm/pages/CrmSocialOauthIntegrationPage";
import CrmGenericIntegrationPage from "./crm/pages/CrmGenericIntegrationPage";
import CrmIntegrationLegacyRedirect from "./crm/pages/CrmIntegrationLegacyRedirect";
import CrmApiKeysPage from "./crm/pages/CrmApiKeysPage";
import CrmApiKeyDetailPage from "./crm/pages/CrmApiKeyDetailPage";
import CrmOrderDetailPage from "./crm/pages/CrmOrderDetailPage";
import CrmProductDetailPage from "./crm/pages/CrmProductDetailPage";
import CrmModerationDetailPage from "./crm/pages/CrmModerationDetailPage";
import CrmSellerDetailPage from "./crm/pages/CrmSellerDetailPage";
import CrmUserDetailPage from "./crm/pages/CrmUserDetailPage";
import CrmTenantsPage from "./crm/pages/CrmTenantsPage";
import CrmCmsPagesPage from "./crm/pages/CrmCmsPagesPage";
import CrmCmsPageDetailPage from "./crm/pages/CrmCmsPageDetailPage";
import MappingPage from "@/pages/admin/catalog/MappingPage";

const queryClient = new QueryClient();

function MaintenanceScreen({
  activeAt,
  marketplaceName,
  supportEmails,
  supportPhones,
}: {
  activeAt?: string | null;
  marketplaceName?: string;
  supportEmails?: MarketplaceContact[];
  supportPhones?: MarketplaceContact[];
}) {
  const primaryEmail = supportEmails?.find((row) => row.email)?.email ?? "support@cheepy.ru";
  const primaryPhone = supportPhones?.find((row) => row.phone)?.phone ?? null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-amber-50 px-4">
      <div className="absolute -left-24 top-16 h-56 w-56 animate-pulse rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-24 bottom-12 h-64 w-64 animate-pulse rounded-full bg-amber-300/20 blur-3xl [animation-delay:700ms]" />
      <div className="relative w-full max-w-xl animate-fade-in rounded-[2rem] border bg-white/90 p-8 text-center shadow-2xl shadow-primary/10 backdrop-blur">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <span className="relative flex h-8 w-8">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
            <span className="relative inline-flex h-8 w-8 rounded-full bg-primary" />
          </span>
        </div>
        <p className="text-sm font-semibold text-primary mb-2">{marketplaceName || "Cheepy"}</p>
        <h1 className="text-2xl font-bold text-foreground mb-3">Витрина на техническом обслуживании</h1>
        <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
          Мы обновляем маркетплейс и скоро вернём доступ к покупкам. Если вопрос срочный, свяжитесь с поддержкой.
        </p>
        <div className="mt-6 rounded-2xl border bg-muted/30 p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Контакты поддержки</p>
          <a className="font-medium text-primary hover:underline" href={`mailto:${primaryEmail}`}>{primaryEmail}</a>
          {primaryPhone ? <p className="mt-1 text-muted-foreground">{primaryPhone}</p> : null}
        </div>
        {activeAt ? <p className="mt-5 text-xs text-muted-foreground">Режим обслуживания активен с {new Date(activeAt).toLocaleString("ru-RU")}</p> : null}
      </div>
    </div>
  );
}

function MaintenanceCountdownBanner({ activeAt }: { activeAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = Math.max(0, new Date(activeAt).getTime() - now);
  const hours = Math.floor(left / 3_600_000);
  const min = Math.floor((left % 3_600_000) / 60_000);
  const sec = Math.floor((left % 60_000) / 1000);
  const timeLeft = hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-slate-950/35 px-4 pt-24 backdrop-blur-sm" role="alertdialog" aria-live="assertive">
      <div className="w-full max-w-lg animate-fade-in rounded-3xl border border-amber-300 bg-white p-6 text-center shadow-2xl shadow-amber-900/20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          !
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Внимание</p>
        <h2 className="mt-2 text-xl font-bold text-foreground">Скоро техническое обслуживание</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Сайт перейдёт в режим обслуживания. Завершите текущие действия заранее, чтобы не потерять изменения.
        </p>
        <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-950">
          <p className="text-xs font-medium">До перехода осталось</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{timeLeft}</p>
        </div>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const [now, setNow] = useState(Date.now());
  const [liveMarketplaceSettings, setLiveMarketplaceSettings] = useState<PublicMarketplaceSettings | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const isSystemRoute = /^\/(crm|admin|constructor)(\/|$)/.test(location.pathname);
  const { data: marketplaceSettings } = useQuery({
    queryKey: ["public-marketplace-settings"],
    queryFn: () => publicApi.marketplaceSettings(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    retry: false,
  });

  useEffect(() => {
    if (isSystemRoute) return;

    let cancelled = false;
    const loadMaintenanceSettings = async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/marketplace-settings?_=${Date.now()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: PublicMarketplaceSettings };
        if (!cancelled && json.data) {
          setLiveMarketplaceSettings(json.data);
        }
      } catch {
        // React Query keeps the normal path; this watchdog is only a no-cache safety net.
      }
    };

    loadMaintenanceSettings();
    const timer = window.setInterval(loadMaintenanceSettings, 60_000);
    const onWake = () => loadMaintenanceSettings();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [isSystemRoute]);

  useEffect(() => {
    if (isSystemRoute) return;
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.channel("marketplace");
    channel.listen(".MarketplaceSettingsUpdated", (data: { settings?: PublicMarketplaceSettings }) => {
      if (data.settings) {
        setLiveMarketplaceSettings(data.settings);
      }
    });

    return () => {
      echo.leave("marketplace");
    };
  }, [isSystemRoute]);

  const publicSettings = liveMarketplaceSettings ?? marketplaceSettings?.data;
  const maintenance = publicSettings?.maintenance;
  const computedActiveAt = maintenance?.started_at
    ? new Date(new Date(maintenance.started_at).getTime() + maintenance.delay_minutes * 60_000).toISOString()
    : null;
  const activeAt = maintenance?.active_at ?? computedActiveAt;
  const activeAtMs = activeAt ? new Date(activeAt).getTime() : 0;
  const maintenanceActive = !isSystemRoute && maintenance?.enabled && activeAtMs > 0 && now >= activeAtMs;
  const maintenanceCountdown = !isSystemRoute && maintenance?.enabled && activeAtMs > 0 && now < activeAtMs;

  if (maintenanceActive) {
    return (
      <MaintenanceScreen
        activeAt={activeAt}
        marketplaceName={publicSettings?.marketplace_name}
        supportEmails={publicSettings?.support_emails}
        supportPhones={publicSettings?.support_phones}
      />
    );
  }

  return (
    <>
    {maintenanceCountdown ? <MaintenanceCountdownBanner activeAt={activeAt} /> : null}
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductPage /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><FavoritesPage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/brand" element={<PageTransition><BrandsListPage /></PageTransition>} />
        <Route path="/brand/:slug" element={<PageTransition><BrandPage /></PageTransition>} />
        <Route path="/seller" element={<PageTransition><SellersListPage /></PageTransition>} />
        <Route path="/seller/:slug" element={<PageTransition><SellerPage /></PageTransition>} />

        {/* Account routes — profile entry is public; sensitive sections require customer auth. */}
        <Route path="/account" element={<PageTransition><AccountLayout /></PageTransition>}>
          <Route index element={<PersonalDataPage />} />
          <Route path="orders" element={<RequireAccountAuth><OrdersPage /></RequireAccountAuth>} />
          <Route path="payment" element={<RequireAccountAuth><PaymentMethodsPage /></RequireAccountAuth>} />
          <Route path="balance" element={<RequireAccountAuth><BalancePage /></RequireAccountAuth>} />
          <Route path="favorites" element={<RequireAccountAuth><FavoritesPage /></RequireAccountAuth>} />
          <Route path="coupons" element={<RequireAccountAuth><CouponsPage /></RequireAccountAuth>} />
          <Route path="receipts" element={<RequireAccountAuth><ReceiptsPage /></RequireAccountAuth>} />
          <Route path="referral" element={<RequireAccountAuth><ReferralPage /></RequireAccountAuth>} />
          <Route path="password" element={<RequireAccountAuth><ChangePasswordPage /></RequireAccountAuth>} />
          {/* Локальная аналитика поведения — доступна без авторизации (хранится в браузере). */}
          <Route path="preferences" element={<PreferencesPage />} />
          <Route path="предпочтения" element={<PreferencesPage />} />
        </Route>

        {/* Person — без авторизации */}
        <Route path="/person" element={<PageTransition><PersonLayout /></PageTransition>}>
          <Route index element={<PersonDashboard />} />
          <Route path="dashboard" element={<PersonDashboard />} />
          <Route path="profile" element={<PersonProfile />} />
          <Route path="orders" element={<PersonOrders />} />
          <Route path="order/:id" element={<PersonOrderDetail />} />
          <Route path="payments" element={<PersonPayments />} />
          <Route path="password" element={<PersonPassword />} />
          <Route path="returns" element={<PersonReturns />} />
          <Route path="favorites" element={<PersonFavorites />} />
          <Route path="viewed" element={<PersonRecentlyViewed />} />
          <Route path="addresses" element={<PersonAddresses />} />
          <Route path="subscriptions" element={<PersonSubscriptions />} />
          <Route path="coupons" element={<PersonCoupons />} />
          <Route path="notifications" element={<PersonNotifications />} />
          <Route path="support" element={<PersonSupport />} />
          <Route path="security" element={<PersonSecurity />} />
          <Route path="settings" element={<PersonSettings />} />
        </Route>

        {/* Info pages */}
        <Route path="/how-to-order" element={<PageTransition><HowToOrderPage /></PageTransition>} />
        <Route path="/payment/success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
        <Route path="/payment/fail" element={<PageTransition><PaymentFailPage /></PageTransition>} />
        <Route path="/payment" element={<PageTransition><PaymentInfoPage /></PageTransition>} />
        <Route path="/delivery" element={<PageTransition><DeliveryPage /></PageTransition>} />
        <Route path="/returns" element={<PageTransition><ReturnsPage /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FaqPage /></PageTransition>} />
        <Route path="/sell" element={<PageTransition><SellPage /></PageTransition>} />
        <Route path="/rules" element={<PageTransition><RulesPage /></PageTransition>} />
        <Route path="/commission" element={<PageTransition><CommissionPage /></PageTransition>} />
        <Route path="/seller-help" element={<PageTransition><SellerHelpPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contacts" element={<PageTransition><ContactsPage /></PageTransition>} />
        <Route path="/careers" element={<PageTransition><CareersPage /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />

        {/* CMS-страницы конструктора: /p/:slug → API public/cms/pages/p/{slug} */}
        <Route path="/p/:slug" element={<PageTransition><CmsDynamicPage /></PageTransition>} />

        {/* Constructor */}
        <Route path="/constructor" element={<SystemAuthGuard><PageTransition><ConstructorPage /></PageTransition></SystemAuthGuard>} />
        <Route path="/constructor/*" element={<SystemAuthGuard><PageTransition><ConstructorPage /></PageTransition></SystemAuthGuard>} />

        {/* Admin routes — НЕ ТРОГАТЬ, парсер работает */}
        <Route path="/admin" element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
          <Route path="login" element={<AdminLoginPage />} />
          <Route element={<AdminAuthGuard><PageTransition><AdminLayout /></PageTransition></AdminAuthGuard>}>
            <Route index element={<DashboardPage />} />
            <Route path="parser" element={<ParserPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="sellers/:id" element={<SellerDetailPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="filters" element={<FiltersPage />} />
          <Route path="ai" element={<AiPage />} />
          <Route path="scheduler" element={<SchedulerPage />} />
          <Route path="excluded" element={<ExcludedPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="attribute-rules" element={<AttributeRulesPage />} />
          <Route path="catalog/mapping" element={<MappingPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* CRM routes — same JWT as admin; unauthenticated → /admin/login */}
        <Route
          path="/crm"
          element={
            <CrmAuthGuard>
              <CrmLayout />
            </CrmAuthGuard>
          }
        >
          <Route index element={<CrmDashboardPage />} />
          <Route path="dashboard" element={<CrmDashboardPage />} />
          <Route path="generate-description" element={<CrmGenerateDescriptionPage />} />
          <Route path="content" element={<CrmContentPage />} />
          <Route path="cms/pages" element={<CrmCmsPagesPage />} />
          <Route path="cms/pages/:id" element={<CrmCmsPageDetailPage />} />
          <Route path="notifications" element={<CrmNotificationsPage />} />
          <Route path="products" element={<CrmProductsPage />} />
          <Route path="products/:id" element={<CrmProductDetailPage />} />
          <Route path="categories" element={<CrmCategoriesPage />} />
          <Route path="catalog/mapping" element={<MappingPage />} />
          <Route path="media" element={<CrmMediaPage />} />
          <Route path="moderation" element={<CrmModerationPage />} />
          <Route path="moderation/:id" element={<CrmModerationDetailPage />} />
          <Route path="orders" element={<CrmOrdersPage />} />
          <Route path="orders/:id" element={<CrmOrderDetailPage />} />
          <Route path="fulfillment" element={<CrmFulfillmentPage />} />
          <Route path="delivery" element={<CrmDeliveryPage />} />
          <Route path="regions" element={<CrmRegionsPage />} />
          <Route path="payments" element={<CrmPaymentsPage />} />
          <Route path="payouts" element={<CrmPayoutsPage />} />
          <Route path="promotions" element={<CrmPromotionsPage />} />
          <Route path="coupons" element={<CrmCouponsPage />} />
          <Route path="bonus-rules" element={<CrmBonusRulesPage />} />
          <Route path="marketing" element={<CrmMarketingPage />} />
          <Route path="marketing/news" element={<CrmMarketingNewsPage />} />
          <Route path="templates" element={<CrmTemplatesPage />} />
          <Route path="users" element={<CrmUsersPage />} />
          <Route path="users/:id" element={<CrmUserDetailPage />} />
          <Route path="sellers" element={<CrmSellersPage />} />
          <Route path="sellers/:id" element={<CrmSellerDetailPage />} />
          <Route path="reviews" element={<CrmReviewsPage />} />
          <Route path="analytics" element={<CrmAnalyticsPage />} />
          <Route path="tenants" element={<CrmTenantsPage />} />
          <Route path="integrations" element={<CrmIntegrationsPage />} />
          <Route path="integrations/payments/:provider" element={<CrmProviderDetailPage />} />
          <Route path="integrations/delivery/:slug" element={<CrmDeliveryIntegrationPage />} />
          <Route path="integrations/maps/:slug" element={<CrmMapsIntegrationPage />} />
          <Route path="integrations/sms/:slug" element={<CrmSmsIntegrationPage />} />
          <Route path="integrations/mail/:slug" element={<CrmMailIntegrationPage />} />
          <Route path="integrations/social/:slug" element={<CrmSocialOauthIntegrationPage />} />
          <Route path="integrations/crm/:slug" element={<CrmGenericIntegrationPage category="crm" />} />
          <Route path="integrations/erp/:slug" element={<CrmGenericIntegrationPage category="erp" />} />
          <Route path="integrations/:provider" element={<CrmIntegrationLegacyRedirect />} />
          <Route path="webhook-logs" element={<CrmWebhookLogsPage />} />
          <Route path="api-keys" element={<CrmApiKeysPage />} />
          <Route path="api-keys/:id" element={<CrmApiKeyDetailPage />} />
          <Route path="settings" element={<CrmSettingsPage />} />
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartProvider>
              <ScrollToTop />
              <AnimatedRoutes />
            </CartProvider>
          </BrowserRouter>
        </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
