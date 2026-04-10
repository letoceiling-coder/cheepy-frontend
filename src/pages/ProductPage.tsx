import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductPageBreadcrumbs from "@/components/page-blocks/product/ProductPageBreadcrumbs";
import ProductDetailHero from "@/components/page-blocks/product/ProductDetailHero";
import ProductDetailTabsSection from "@/components/page-blocks/product/ProductDetailTabsSection";
import ProductSellerCardSection from "@/components/page-blocks/product/ProductSellerCardSection";
import ProductRecentlyViewedSection from "@/components/page-blocks/product/ProductRecentlyViewedSection";
import ProductBuyTogetherSection from "@/components/page-blocks/product/ProductBuyTogetherSection";
import ProductSimilarProductsSection from "@/components/page-blocks/product/ProductSimilarProductsSection";

const ProductPage = () => {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <ProductPageBreadcrumbs />
        <ProductDetailHero />
        <ProductDetailTabsSection />
        <ProductSellerCardSection />
        <ProductRecentlyViewedSection />
        <ProductBuyTogetherSection />
        <ProductSimilarProductsSection />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ProductPage;
