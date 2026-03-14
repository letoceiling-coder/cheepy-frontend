import { ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const demos = [
  { name: "Куртка-парка", price: "7 990 ₽", poster: product1, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { name: "Кроссовки Air", price: "5 490 ₽", poster: product2, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { name: "Сумка кожаная", price: "4 990 ₽", poster: product3, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
  { name: "Часы классик", price: "8 990 ₽", poster: product4, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
];

const DemoCard = ({ item }: { item: (typeof demos)[0] }) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden group cursor-pointer">
    <div className="aspect-square overflow-hidden relative">
      <video autoPlay muted loop playsInline preload="metadata" poster={item.poster} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105">
        <source src={item.video} type="video/mp4" />
      </video>
    </div>
    <div className="p-2.5 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-foreground">{item.name}</p>
        <p className="text-xs font-bold text-primary">{item.price}</p>
      </div>
      <button className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity">
        <ShoppingCart size={12} className="text-primary-foreground" />
      </button>
    </div>
  </div>
);

const ProductDemoCards = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Видеодемо товаров</h2>
      <p className="text-sm text-muted-foreground mb-4">Автоматическое воспроизведение</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {demos.map((d, i) => <DemoCard key={i} item={d} />)}
      </div>
    </section>
  );
};

export default ProductDemoCards;
