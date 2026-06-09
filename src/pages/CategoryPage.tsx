import { Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import CategoryPageBreadcrumbs from "@/components/page-blocks/category/CategoryPageBreadcrumbs";
import CategoryHeroBanner from "@/components/page-blocks/category/CategoryHeroBanner";
import CategoryListingContent from "@/components/page-blocks/category/CategoryListingContent";
import { resolveCategorySlug } from "@/lib/categorySlugAliases";

const CategoryPage = () => {
  const { slug } = useParams();
  const resolvedSlug = resolveCategorySlug(slug);
  if (slug && resolvedSlug && resolvedSlug !== slug) {
    return <Navigate to={`/category/${encodeURIComponent(resolvedSlug)}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <CategoryPageBreadcrumbs />
        <CategoryHeroBanner />
        <CategoryListingContent />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CategoryPage;
