import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const tiles = [
  { name: "Куртки", image: product1, span: "col-span-2 row-span-2" },
  { name: "Кроссовки", image: product2, span: "col-span-1 row-span-1" },
  { name: "Платья", image: product3, span: "col-span-1 row-span-1" },
  { name: "Сумки", image: product4, span: "col-span-1 row-span-2" },
  { name: "Джинсы", image: product5, span: "col-span-1 row-span-1" },
  { name: "Свитшоты", image: product6, span: "col-span-1 row-span-1" },
];

const CategoriesMosaic = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-8">Каталог категорий</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px] gap-3">
        {tiles.map((t, i) => (
          <div key={i} className={`${t.span} rounded-xl overflow-hidden relative cursor-pointer group`}>
            <img src={t.image} alt={t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent group-hover:from-foreground/80 transition-all duration-300" />
            <div className="absolute bottom-4 left-4">
              <h3 className="text-primary-foreground font-semibold text-lg">{t.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesMosaic;
