import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

type HeroSliderCta = { text: string; url: string; target?: "_self" | "_blank" };
type HeroSliderMediaItem = {
  id?: string;
  mediaFileId?: number | null;
  url?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  alt?: string;
  cta?: HeroSliderCta;
};

type HeroSliderProps = {
  /** SettingsPanel profile P-HERO-MEDIA */
  media?: HeroSliderMediaItem[];
  overlayOpacity?: number;
  cta?: HeroSliderCta;
  className?: string;
};

const fallbackSlides = [
  { image: hero1, title: "Футболка ПОЛО", subtitle: "Новая коллекция", cta: "Смотреть" },
  { image: hero2, title: "Streetwear Collection", subtitle: "Лучшие образы", cta: "Смотреть" },
  { image: hero3, title: "Летняя коллекция", subtitle: "Скидки до 50%", cta: "Купить" },
] as const;

const HeroSlider = ({ media, overlayOpacity, cta, className }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = useMemo(() => {
    const items = Array.isArray(media) ? media : [];
    const normalized = items
      .map((x) => {
        const imageUrl = typeof x?.url === "string" ? x.url : "";
        const title = typeof x?.title === "string" ? x.title : "";
        const subtitle = typeof x?.subtitle === "string" ? x.subtitle : "";
        const fallbackCtaText = typeof cta?.text === "string" ? cta.text : "";
        const perSlideCtaText = typeof x?.cta?.text === "string" ? x.cta.text : "";
        const ctaText = perSlideCtaText || fallbackCtaText;
        const ctaUrl = typeof x?.cta?.url === "string" ? x.cta.url : (typeof cta?.url === "string" ? cta.url : "");
        const ctaTarget = x?.cta?.target || cta?.target || "_self";
        const alt = (typeof x?.alt === "string" && x.alt) || title || subtitle || "Hero slide";
        return { imageUrl, title, subtitle, ctaText, ctaUrl, ctaTarget, alt };
      })
      .filter((x) => Boolean(x.imageUrl || x.title || x.subtitle));

    if (normalized.length > 0) return normalized;
    return fallbackSlides.map((s) => ({ imageUrl: s.image, title: s.title, subtitle: s.subtitle, ctaText: s.cta, ctaUrl: "", ctaTarget: "_self" as const, alt: s.title }));
  }, [media, cta]);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden mb-8 ${className ?? ""}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[320px] md:h-[420px] lg:h-[520px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <img src={slide.imageUrl} alt={slide.alt} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent flex items-center"
              style={{ opacity: Math.min(1, Math.max(0, (typeof overlayOpacity === "number" ? overlayOpacity : 60) / 100)) }}
            >
              <div className="px-10 md:px-16 max-w-[480px]">
                {slide.subtitle ? <p className="text-primary-foreground/80 text-sm mb-1">{slide.subtitle}</p> : null}
                {slide.title ? <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">{slide.title}</h2> : null}
                {slide.ctaText ? (
                  slide.ctaUrl ? (
                    <a
                      href={slide.ctaUrl}
                      target={slide.ctaTarget}
                      rel={slide.ctaTarget === "_blank" ? "noreferrer" : undefined}
                      className="inline-flex gradient-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {slide.ctaText}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {slide.ctaText}
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 p-2 rounded-full hover:bg-background transition-colors">
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 p-2 rounded-full hover:bg-background transition-colors">
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      {/* Pagination dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-primary-foreground w-6" : "bg-primary-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
