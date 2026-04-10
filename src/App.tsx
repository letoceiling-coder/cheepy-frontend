import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
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
import CrmMarketingPage from "./crm/pages/CrmMarketingPage";
import CrmTemplatesPage from "./crm/pages/CrmTemplatesPage";
import CrmNotificationsPage from "./crm/pages/CrmNotificationsPage";
import CrmIntegrationsPage from "./crm/pages/CrmIntegrationsPage";
import CrmWebhookLogsPage from "./crm/pages/CrmWebhookLogsPage";
import CrmProviderDetailPage from "./crm/pages/CrmProviderDetailPage";
import CrmApiKeysPage from "./crm/pages/CrmApiKeysPage";
import CrmApiKeyDetailPage from "./crm/pages/CrmApiKeyDetailPage";
import CrmOrderDetailPage from "./crm/pages/CrmOrderDetailPage";
import CrmProductDetailPage from "./crm/pages/CrmProductDetailPage";
import CrmModerationDetailPage from "./crm/pages/CrmModerationDetailPage";
import CrmSellerDetailPage from "./crm/pages/CrmSellerDetailPage";
import CrmUserDetailPage from "./crm/pages/CrmUserDetailPage";
import CrmTenantsPage from "./crm/pages/CrmTenantsPage";
import MappingPage from "@/pages/admin/catalog/MappingPage";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/category/:slug" element={<PageTransition><CategoryPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductPage /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><FavoritesPage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/brand" element={<PageTransition><BrandsListPage /></PageTransition>} />
        <Route path="/brand/:slug" element={<PageTransition><BrandPage /></PageTransition>} />
        <Route path="/seller" element={<PageTransition><SellersListPage /></PageTransition>} />
        <Route path="/seller/:id" element={<PageTransition><SellerPage /></PageTransition>} />

        {/* Account routes — public, no auth redirect (demo mode) */}
        <Route path="/account" element={<PageTransition><AccountLayout /></PageTransition>}>
          <Route index element={<PersonalDataPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payment" element={<PaymentMethodsPage />} />
          <Route path="balance" element={<BalancePage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="referral" element={<ReferralPage />} />
          <Route path="password" element={<ChangePasswordPage />} />
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
        <Route path="/constructor" element={<PageTransition><ConstructorPage /></PageTransition>} />
        <Route path="/constructor/*" element={<PageTransition><ConstructorPage /></PageTransition>} />

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
          <Route path="content" element={<CrmContentPage />} />
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
          <Route path="marketing" element={<CrmMarketingPage />} />
          <Route path="templates" element={<CrmTemplatesPage />} />
          <Route path="users" element={<CrmUsersPage />} />
          <Route path="users/:id" element={<CrmUserDetailPage />} />
          <Route path="sellers" element={<CrmSellersPage />} />
          <Route path="sellers/:id" element={<CrmSellerDetailPage />} />
          <Route path="reviews" element={<CrmReviewsPage />} />
          <Route path="analytics" element={<CrmAnalyticsPage />} />
          <Route path="tenants" element={<CrmTenantsPage />} />
          <Route path="integrations" element={<CrmIntegrationsPage />} />
          <Route path="integrations/:provider" element={<CrmProviderDetailPage />} />
          <Route path="webhook-logs" element={<CrmWebhookLogsPage />} />
          <Route path="api-keys" element={<CrmApiKeysPage />} />
          <Route path="api-keys/:id" element={<CrmApiKeyDetailPage />} />
          <Route path="settings" element={<CrmSettingsPage />} />
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <AnimatedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
