import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import look1 from "@/assets/look-1.jpg";

const collections = [
  { title: "Urban Heritage", tag: "Streetwear", image: hero1 },
  { title: "Classic Elegance", tag: "Формальный", image: look1 },
  { title: "Summer Vibes", tag: "Повседневный", image: hero2 },
];

const ProductCollection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6">Коллекции</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collections.map((c, i) => (
          <div key={i} className="rounded-xl overflow-hidden relative cursor-pointer group aspect-[3/4]">
            <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground text-xs px-3 py-1 rounded-full">{c.tag}</span>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <h3 className="text-xl font-bold text-primary-foreground mb-2">{c.title}</h3>
              <span className="flex items-center gap-1 text-primary-foreground text-sm font-medium transition-all group-hover:gap-2">
                Смотреть <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductCollection;
