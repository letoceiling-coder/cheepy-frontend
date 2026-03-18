import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { popularCategories } from "@/data/marketplaceData";

const PopularCategories = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-bold text-foreground">ПОПУЛЯРНЫЕ КАТЕГОРИИ</h2>
        <Link to="/category/all" className="text-sm text-primary hover:underline ml-auto">Все категории</Link>
      </div>

      {/* Desktop: 2x3 grid */}
      <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-4">
        {popularCategories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className="group relative h-[180px] rounded-xl overflow-hidden"
          >
            <img
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/55 transition-colors duration-300" />
            <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
              <h3 className="text-lg font-bold text-primary-foreground mb-0.5">{cat.name}</h3>
              <p className="text-sm text-primary-foreground/70 mb-3">{cat.count.toLocaleString()} товаров</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground bg-primary/80 px-4 py-1.5 rounded-full group-hover:bg-primary transition-colors">
                Перейти <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: horizontal slider */}
      <div className="md:hidden relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
            className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground"
            aria-label="Назад"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={scrollRef} className="flex-1 overflow-x-auto flex gap-3 no-scrollbar snap-x snap-mandatory py-1 cursor-grab active:cursor-grabbing">
            {popularCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="group shrink-0 w-[200px] h-[140px] relative rounded-xl overflow-hidden snap-start"
              >
                <img src={cat.image} alt={cat.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/40" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
                  <h3 className="text-base font-bold text-primary-foreground">{cat.name}</h3>
                  <p className="text-xs text-primary-foreground/70">{cat.count.toLocaleString()} товаров</p>
                </div>
              </Link>
            ))}
          </div>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
            className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground"
            aria-label="Вперёд"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;
