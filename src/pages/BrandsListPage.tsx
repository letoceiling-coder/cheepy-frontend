import { Link } from "react-router-dom";
import { ChevronRight, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import BrandLogo from "@/components/BrandLogo";
import { brandsData } from "@/data/marketplaceData";

const BrandsListPage = () => {
  const topBrands = brandsData.slice(0, 8);
  const allBrands = brandsData;

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Бренды</span>
        </div>

        {/* Hero */}
        <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Все бренды</h1>
          <p className="text-sm md:text-base opacity-80">
            Выбирайте товары от проверенных мировых и локальных брендов
          </p>
          <p className="text-sm opacity-60 mt-2">{brandsData.length} брендов в каталоге</p>
        </div>

        {/* Top brands */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-foreground">Популярные бренды</h2>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {topBrands.map(brand => (
              <Link
                key={brand.slug}
                to={`/brand/${brand.slug}`}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform p-3">
                    <BrandLogo brand={brand.logo} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{brand.name}</h3>
                    <p className="text-xs text-muted-foreground">{brand.productCount} товаров</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All brands */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-5">Все бренды А-Я</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allBrands.map(brand => (
              <Link
                key={brand.slug}
                to={`/brand/${brand.slug}`}
                className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform p-2">
                  <BrandLogo brand={brand.logo} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{brand.name}</h3>
                  <p className="text-xs text-muted-foreground">{brand.productCount} товаров</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Info */}
        <section className="mb-10">
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">О брендах на нашей площадке</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Мы сотрудничаем только с проверенными брендами, которые предлагают качественные товары и заботятся о своих покупателях. 
              Все товары от официальных представителей с гарантией качества и оригинальности. 
              Найдите любимый бренд или откройте для себя новые — у нас представлены как мировые гиганты, так и локальные производители.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BrandsListPage;
