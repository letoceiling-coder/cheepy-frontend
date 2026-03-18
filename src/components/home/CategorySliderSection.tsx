import { useCallback, useEffect, useRef, useState } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import CategoryCard from "./CategoryCard";
import CategorySliderControls from "./CategorySliderControls";
import { popularCategories } from "@/data/marketplaceData";

// Extend categories to have 10 items for the slider
const sliderCategories = [
  ...popularCategories,
  { slug: "dzhinsy", name: "Джинсы", count: 340, image: popularCategories[1].image },
  { slug: "kostyumy", name: "Костюмы", count: 215, image: popularCategories[3].image },
  { slug: "futbolki", name: "Футболки", count: 1890, image: popularCategories[4].image },
  { slug: "shorty", name: "Шорты", count: 420, image: popularCategories[2].image },
];

const CategorySliderSection = () => {
  const [current, setCurrent] = useState(0);
  const total = sliderCategories.length;
  const scrollRef = useDragScroll<HTMLDivElement>();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    itemRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev + 1) % total;
      scrollToIndex(n);
      return n;
    });
  }, [scrollToIndex, total]);

  const prev = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev - 1 + total) % total;
      scrollToIndex(n);
      return n;
    });
  }, [scrollToIndex, total]);

  return (
    <section className="mb-8 w-full">
      <div className="rounded-2xl" style={{ background: "hsl(0, 0%, 13%)" }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left control panel */}
          <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-primary-foreground/10">
            <CategorySliderControls current={current} total={total} onPrev={prev} onNext={next} />
          </div>

          {/* Right - category cards (native horizontal scroll; no transform/oversized widths) */}
          <div className="md:col-span-9">
            <div
              ref={scrollRef}
              className={
                "flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing " +
                (isMobile ? "p-4" : "p-6")
              }
            >
              {sliderCategories.map((cat, i) => (
                <div
                  key={cat.slug}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="flex-shrink-0 snap-start"
                >
                  <CategoryCard slug={cat.slug} name={cat.name} count={cat.count} image={cat.image} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySliderSection;
