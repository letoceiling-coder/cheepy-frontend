import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Star, MessageCircle, CheckCircle, Clock, Package, ThumbsUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { sellersData } from "@/data/marketplaceData";
import { mockProducts } from "@/data/mock-data";

const SellerPage = () => {
  const { id } = useParams();
  const seller = sellersData.find(s => s.id === id) || sellersData[0];
  const sellerProducts = mockProducts.slice(0, 12);
  const [sortBy, setSortBy] = useState("popular");

  const registeredDate = new Date(seller.registeredAt);
  const dateStr = registeredDate.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{seller.name}</span>
        </div>

        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <img src={seller.avatar} alt={seller.name} className="w-20 h-20 rounded-2xl object-cover" />
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{seller.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  {seller.rating}
                </span>
                <span>{seller.reviewCount} отзывов</span>
                <span>{seller.productCount} товаров</span>
                <span>На площадке с {dateStr}</span>
              </div>
              <button className="gradient-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <MessageCircle className="w-4 h-4" />
                Написать продавцу
              </button>
            </div>
          </div>
        </div>

        {/* Trust metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <ThumbsUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{seller.positivePercent}%</p>
            <p className="text-xs text-muted-foreground">Положительных отзывов</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{seller.responseTime}</p>
            <p className="text-xs text-muted-foreground">Время ответа</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{seller.completedOrders.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Выполненных заказов</p>
          </div>
        </div>

        {/* Products */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Товары продавца</h2>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
            >
              <option value="popular">По популярности</option>
              <option value="price_asc">Сначала дешёвые</option>
              <option value="price_desc">Сначала дорогие</option>
              <option value="new">Новинки</option>
              <option value="rating">По рейтингу</option>
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sellerProducts.map(p => (
              <Link key={p.id} to={`/product/${p.id}`}>
                <ProductCard product={p} />
              </Link>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Отзывы о продавце</h2>
          <div className="space-y-3">
            {seller.reviews.map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {r.author[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{r.author}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-yellow-500 text-yellow-500" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
                <p className="text-sm text-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">О продавце</h2>
          <div className="bg-secondary rounded-xl p-6">
            <p className="text-sm text-foreground leading-relaxed mb-4">{seller.about}</p>
            {seller.contacts.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                {seller.contacts.map(c => c.value).join(" · ")}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SellerPage;
