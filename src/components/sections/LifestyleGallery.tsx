import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import look1 from "@/assets/look-1.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";

const items = [
  { image: hero1, tag: "Образ дня", title: "Уличный стиль" },
  { image: product1, tag: "Тренд", title: "Кожаные аксессуары" },
  { image: hero2, tag: "Подборка", title: "Весна 2025" },
  { image: look1, tag: "Лукбук", title: "Минимализм" },
  { image: product2, tag: "Стиль", title: "Casual Friday" },
  { image: hero3, tag: "Вдохновение", title: "Вечерний выход" },
];

const LifestyleGallery = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Стиль жизни</h2>
      <p className="text-sm text-muted-foreground mb-4">Вдохновение для вашего гардероба</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map((item, i) => (
          <div key={i} className={`relative rounded-xl overflow-hidden cursor-pointer group ${i === 0 ? "md:row-span-2 aspect-[3/4] md:aspect-auto" : "aspect-[4/3]"}`}>
            <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute top-2.5 left-2.5">
              <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">{item.tag}</span>
            </div>
            <div className="absolute bottom-3 left-3">
              <h3 className="text-sm font-bold text-primary-foreground">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LifestyleGallery;
