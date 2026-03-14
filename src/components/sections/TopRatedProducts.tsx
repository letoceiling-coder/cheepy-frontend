import { Star, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const products = [
  { name: "Кожаная сумка", price: "5 990 ₽", rating: 4.9, reviews: 342, image: product1 },
  { name: "Кроссовки Air", price: "7 490 ₽", rating: 4.8, reviews: 287, image: product2 },
  { name: "Пальто шерсть", price: "12 990 ₽", rating: 4.9, reviews: 198, image: product3 },
  { name: "Рюкзак Urban", price: "3 490 ₽", rating: 4.7, reviews: 456, image: product4 },
  { name: "Часы классик", price: "8 990 ₽", rating: 4.8, reviews: 163, image: product5 },
  { name: "Куртка парка", price: "9 990 ₽", rating: 4.9, reviews: 221, image: product6 },
];

const TopRatedProducts = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Лучшие по отзывам</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Товары с рейтингом 4.7+</p>
        </div>
        <button className="hidden md:flex items-center gap-1 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
          Все товары <ArrowRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {products.map((p, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden group cursor-pointer">
            <div className="aspect-square overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{p.price}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star size={11} className="text-primary fill-primary" />
                <span className="text-[10px] font-medium text-foreground">{p.rating}</span>
                <span className="text-[10px] text-muted-foreground">({p.reviews})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopRatedProducts;
