import { Star, Package, UserPlus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { sellersData } from "@/data/marketplaceData";
import seller5 from "@/assets/cheepy/seller-5.jpg";

const extraSellers = [
  { id: "glamour", name: "Glamour Shop", avatar: seller5, rating: 4.7, reviewCount: 678, productCount: 189 },
];

const allSellers = [...sellersData, ...extraSellers];

const SellerSpotlight = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Лучшие продавцы</h2>
      <p className="text-muted-foreground text-sm mb-8">Проверенные магазины с отличной репутацией</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {allSellers.map((s) => (
          <div key={s.id} className="bg-card rounded-xl border border-border p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 group">
            <div className="flex items-center gap-4 mb-4">
              <img src={s.avatar} alt={s.name} className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors" />
              <div>
                <h3 className="font-semibold text-foreground">{s.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm text-foreground font-medium">{s.rating}</span>
                  <span className="text-xs text-muted-foreground">({s.reviewCount})</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Package size={14} />
              <span>{s.productCount} товаров</span>
            </div>
            <button className="w-full h-10 rounded-lg border border-primary text-primary font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <UserPlus size={14} /> Подписаться
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SellerSpotlight;
