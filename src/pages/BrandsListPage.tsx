import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import BrandsListBreadcrumbs from "@/components/page-blocks/brands/BrandsListBreadcrumbs";
import BrandsListHero from "@/components/page-blocks/brands/BrandsListHero";
import BrandsListPopularSection from "@/components/page-blocks/brands/BrandsListPopularSection";
import BrandsListAllSection from "@/components/page-blocks/brands/BrandsListAllSection";
import BrandsListInfoSection from "@/components/page-blocks/brands/BrandsListInfoSection";

const BrandsListPage = () => {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <BrandsListBreadcrumbs />
        <BrandsListHero />
        <BrandsListPopularSection />
        <BrandsListAllSection />
        <BrandsListInfoSection />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BrandsListPage;
