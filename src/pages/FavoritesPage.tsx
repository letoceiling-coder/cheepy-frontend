import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import FavoritesPageContent from "@/components/page-blocks/favorites/FavoritesPageContent";

const FavoritesPage = () => {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <FavoritesPageContent />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default FavoritesPage;
