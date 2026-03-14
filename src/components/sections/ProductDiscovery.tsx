import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const spans = ["row-span-2", "", "", "row-span-2", "", "", "", "row-span-2", "", ""];

const ProductDiscovery = () => {
  const { ref, isVisible } = useScrollAnimation();
  const products = mockProducts.slice(0, 10);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Откройте для себя</h2>
      <p className="text-muted-foreground text-sm mb-6">Лучшие находки маркетплейса</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[180px] gap-3">
        {products.map((p, i) => (
          <div key={p.id} className={`${spans[i] || ""} rounded-xl overflow-hidden relative cursor-pointer group`}>
            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-xs text-primary-foreground truncate">{p.name}</p>
              <p className="text-sm font-bold text-primary-foreground">{p.price.toLocaleString()} ₽</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductDiscovery;
