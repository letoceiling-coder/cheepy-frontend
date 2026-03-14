import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const brands = [
  "Nike", "Zara", "H&M", "Mango", "Uniqlo", "Levi's",
  "Adidas", "Gucci", "Puma", "Tommy Hilfiger", "Calvin Klein", "Lacoste",
];

const BrandShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Популярные бренды</h2>
      <div className="overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-[scroll_20s_linear_infinite] gap-8 w-max">
          {[...brands, ...brands].map((b, i) => (
            <div key={i} className="flex-shrink-0 h-16 px-8 bg-secondary rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors duration-300">
              <span className="font-bold text-foreground text-lg whitespace-nowrap">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;
