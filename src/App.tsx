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
import { AdminLayout } from "./admin/components/AdminLayout";
import { AdminAuthGuard } from "./admin/components/AdminAuthGuard";
import { AdminAuthProvider } from "./admin/contexts/AdminAuthContext";
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import DashboardPage from "./admin/pages/DashboardPage";
import ParserPage from "./admin/pages/ParserPage";
import ProductsPage from "./admin/pages/ProductsPage";
import ProductDetailPage from "./admin/pages/ProductDetailPage";
import CategoriesPage from "./admin/pages/CategoriesPage";
import BrandsPage from "./admin/pages/BrandsPage";
import FiltersPage from "./admin/pages/FiltersPage";
import AiPage from "./admin/pages/AiPage";
import SchedulerPage from "./admin/pages/SchedulerPage";
import ExcludedPage from "./admin/pages/ExcludedPage";
import LogsPage from "./admin/pages/LogsPage";
import RolesPage from "./admin/pages/RolesPage";
import SettingsPage from "./admin/pages/SettingsPage";
import { CrmLayout } from "./crm/layout/CrmLayout";
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
import CrmOrderDetailPage from "./crm/pages/CrmOrderDetailPage";
import CrmProductDetailPage from "./crm/pages/CrmProductDetailPage";
import CrmModerationDetailPage from "./crm/pages/CrmModerationDetailPage";
import CrmSellerDetailPage from "./crm/pages/CrmSellerDetailPage";
import CrmUserDetailPage from "./crm/pages/CrmUserDetailPage";
import CrmTenantsPage from "./crm/pages/CrmTenantsPage";

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

        {/* Account routes */}
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

        {/* Admin routes */}
        <Route path="/admin" element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
          <Route path="login" element={<AdminLoginPage />} />
          <Route element={<AdminAuthGuard><PageTransition><AdminLayout /></PageTransition></AdminAuthGuard>}>
            <Route index element={<DashboardPage />} />
            <Route path="parser" element={<ParserPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="filters" element={<FiltersPage />} />
          <Route path="ai" element={<AiPage />} />
          <Route path="scheduler" element={<SchedulerPage />} />
          <Route path="excluded" element={<ExcludedPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* CRM routes */}
        <Route path="/crm" element={<CrmLayout />}>
          <Route index element={<CrmDashboardPage />} />
          <Route path="dashboard" element={<CrmDashboardPage />} />
          <Route path="content" element={<CrmContentPage />} />
          <Route path="notifications" element={<CrmNotificationsPage />} />
          <Route path="products" element={<CrmProductsPage />} />
          <Route path="products/:id" element={<CrmProductDetailPage />} />
          <Route path="categories" element={<CrmCategoriesPage />} />
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
