import { Link } from "react-router-dom";
import { ChevronRight, Star, TrendingUp, Package, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { sellersData } from "@/data/marketplaceData";

const SellersListPage = () => {
  const topSellers = sellersData.slice(0, 4);
  const allSellers = sellersData;

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Продавцы</span>
        </div>

        {/* Hero */}
        <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Все продавцы</h1>
          <p className="text-sm md:text-base opacity-80">
            Выбирайте товары от проверенных продавцов с высоким рейтингом
          </p>
          <p className="text-sm opacity-60 mt-2">{sellersData.length}+ продавцов на площадке</p>
        </div>

        {/* Top sellers */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-foreground">Топ продавцов</h2>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {topSellers.map(seller => (
              <Link
                key={seller.id}
                to={`/seller/${seller.id}`}
                className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <img 
                      src={seller.avatar} 
                      alt={seller.name} 
                      className="w-20 h-20 rounded-2xl object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      {seller.rating}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{seller.name}</h3>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {seller.productCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {seller.reviewCount}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All sellers */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-5">Все продавцы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSellers.map(seller => (
              <Link
                key={seller.id}
                to={`/seller/${seller.id}`}
                className="group flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="relative shrink-0">
                  <img 
                    src={seller.avatar} 
                    alt={seller.name} 
                    className="w-16 h-16 rounded-xl object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {seller.rating}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{seller.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      {seller.reviewCount} отзывов
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {seller.productCount} товаров
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {seller.positivePercent}% положительных
                    </span>
                    <span className="text-muted-foreground">
                      {seller.completedOrders.toLocaleString()} заказов
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Info */}
        <section className="mb-10">
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">О продавцах на нашей площадке</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Мы тщательно проверяем каждого продавца перед допуском на площадку. Все продавцы проходят верификацию, 
              подтверждают свою личность и предоставляют необходимые документы. Мы следим за качеством обслуживания 
              и оперативностью доставки. Покупайте с уверенностью — каждая сделка защищена гарантией безопасности Cheepy.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SellersListPage;
