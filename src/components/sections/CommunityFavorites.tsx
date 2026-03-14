import { Heart, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const favorites = [
  { name: "Кожаная куртка", price: "9 990 ₽", likes: 1243, image: product1 },
  { name: "Кроссовки Air Max", price: "7 990 ₽", likes: 987, image: product2 },
  { name: "Шерстяное пальто", price: "12 490 ₽", likes: 856, image: product3 },
  { name: "Рюкзак городской", price: "3 990 ₽", likes: 1567, image: product4 },
  { name: "Часы наручные", price: "5 490 ₽", likes: 723, image: product5 },
  { name: "Ботинки челси", price: "8 490 ₽", likes: 934, image: product6 },
];

const CommunityFavorites = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Любимое покупателей</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Самые добавляемые в избранное</p>
        </div>
        <button className="hidden md:flex items-center gap-1 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
          Все <ArrowRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {favorites.map((f, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden group cursor-pointer">
            <div className="aspect-square overflow-hidden relative">
              <img src={f.image} alt={f.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-foreground/60 backdrop-blur-sm text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                <Heart size={10} className="fill-current" /> {f.likes > 999 ? `${(f.likes / 1000).toFixed(1)}K` : f.likes}
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{f.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommunityFavorites;
