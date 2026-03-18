import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";

interface BrandStripProps {
  visible?: boolean;
}

const brands = [
  { slug: "nike", name: "Nike" },
  { slug: "zara", name: "Zara" },
  { slug: "adidas", name: "Adidas" },
  { slug: "hm", name: "H&M" },
  { slug: "uniqlo", name: "Uniqlo" },
  { slug: "puma", name: "Puma" },
  { slug: "mango", name: "Mango" },
  { slug: "levis", name: "Levi's" },
  { slug: "gucci", name: "Gucci" },
  { slug: "balenciaga", name: "Balenciaga" },
];

const BrandStrip = ({ visible = true }: BrandStripProps) => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  if (!visible) return null;

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">ПОПУЛЯРНЫЕ БРЕНДЫ</h2>
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
          className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-accent/10 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div ref={scrollRef} className="flex-1 overflow-x-auto flex gap-3 no-scrollbar py-1 cursor-grab active:cursor-grabbing">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              to={`/brand/${brand.slug}`}
              className="shrink-0 px-6 py-3 rounded-xl border border-border bg-card hover:border-primary hover:shadow-sm transition-all flex items-center justify-center"
            >
              <span className="text-sm font-bold text-foreground whitespace-nowrap">{brand.name}</span>
            </Link>
          ))}
        </div>
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
          className="shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-accent/10 transition-colors"
          aria-label="Вперед"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default BrandStrip;
