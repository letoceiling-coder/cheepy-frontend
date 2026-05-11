import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSwipeSlides } from "@/hooks/useSwipeSlides";
import { normalizeBlockProfileSettings, type BannerMediaSettings } from "@/constructor/settingsProfiles";
import { useConstructorCanvasPreview } from "@/constructor/context/ConstructorCanvasPreviewContext";
import { mediaItemsToSlides, type MediaSlide } from "@/lib/mediaItemsToSlides";
import hero1 from "@/assets/hero-1.jpg";

export type PromoBannerProps = Partial<BannerMediaSettings> &
  Record<string, unknown> & {
    /** Статическая главная без шаблона: если медиа не заданы, показать встроенный демо-слайд. */
    allowDemoBanner?: boolean;
  };

function demoSlides(): MediaSlide[] {
  return [
    {
      imageUrl: hero1,
      caption: "Специальное предложение",
      title: "Скидки до 70% на весеннюю коллекцию",
      subtitle: "Более 5 000 товаров по сниженным ценам",
      ctaText: "Смотреть",
      ctaUrl: "",
      ctaTarget: "_self",
      alt: "Promo",
    },
  ];
}

function CtaControl({ slide }: { slide: MediaSlide }) {
  const { ctaText, ctaUrl, ctaTarget } = slide;
  if (!ctaText.trim()) return null;
  const common =
    "mt-6 inline-flex h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold items-center gap-2 hover:opacity-90 transition-all duration-300 group";
  if (ctaUrl.startsWith("/") && ctaTarget !== "_blank") {
    return (
      <Link to={ctaUrl} className={common}>
        {ctaText} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    );
  }
  if (ctaUrl.trim()) {
    return (
      <a href={ctaUrl} target={ctaTarget} rel={ctaTarget === "_blank" ? "noopener noreferrer" : undefined} className={common}>
        {ctaText} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </a>
    );
  }
  return (
    <button type="button" className={common}>
      {ctaText} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </button>
  );
}

const PromoBanner = (props: PromoBannerProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const constructorPreview = useConstructorCanvasPreview();
  const allowDemoBanner = props.allowDemoBanner === true;

  const normalized = normalizeBlockProfileSettings("PromoBanner", props as Record<string, unknown>);
  const banner = normalized as BannerMediaSettings;
  const visible = banner.visible !== false;

  const slidesFromSettings = useMemo(() => mediaItemsToSlides(banner.media, undefined, true), [banner.media]);

  const autoplaySeconds = Number.isFinite(banner.autoplaySeconds) ? Math.max(0, Math.round(banner.autoplaySeconds)) : 0;

  let slides = slidesFromSettings;
  if (slides.length === 0 && constructorPreview) slides = demoSlides();
  else if (slides.length === 0 && allowDemoBanner) slides = demoSlides();

  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((p) => (slides.length > 0 ? (p + 1) % slides.length : 0)), [slides.length]);
  const prev = useCallback(() => setCurrent((p) => {
    const n = slides.length;
    return n > 0 ? (p - 1 + n) % n : 0;
  }), [slides.length]);

  const swipeBannerRef = useSwipeSlides({
    onSwipePrev: prev,
    onSwipeNext: next,
  });

  useEffect(() => {
    setCurrent((c) => (slides.length > 0 ? c % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || autoplaySeconds <= 0) return;
    const t = setInterval(next, autoplaySeconds * 1000);
    return () => clearInterval(t);
  }, [autoplaySeconds, next, slides.length]);

  const blockTitle = (banner.title ?? "").trim();
  const blockSubtitle = (banner.subtitle ?? "").trim();

  if (!visible) return null;

  if (slides.length === 0) return null;

  const sample = slidesFromSettings.length === 0 && (constructorPreview || allowDemoBanner);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      {(blockTitle || blockSubtitle || sample) ? (
        <div className="flex items-baseline gap-3 mb-2">
          {blockTitle ? <h2 className="text-xl font-bold text-foreground">{blockTitle}</h2> : null}
          {sample ? <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Образец</span> : null}
        </div>
      ) : null}
      {blockSubtitle ? <p className="text-muted-foreground text-sm mb-4">{blockSubtitle}</p> : null}

      <div ref={swipeBannerRef} className="relative rounded-2xl overflow-hidden h-[280px] md:h-[360px] touch-pan-y">
        {slides.map((s, i) => {
          const eyebrow = (s.caption || "").trim() || "Специальное предложение";
          const headline = (s.title || "").trim() || blockTitle || "Акции и спецпредложения";
          const description = (s.subtitle || "").trim() || blockSubtitle;
          return (
            <div
              key={`${s.imageUrl}-${i}`}
              className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-[1]" : "opacity-0 pointer-events-none z-0"}`}
            >
              <img src={s.imageUrl} alt={s.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="px-8 md:px-14 max-w-lg">
                  <span className="text-xs uppercase tracking-widest text-primary-foreground/70 font-medium">{eyebrow}</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mt-3 leading-tight">{headline}</h2>
                  {description ? <p className="text-primary-foreground/80 mt-3 text-sm">{description}</p> : null}
                  <CtaControl slide={s} />
                </div>
              </div>
            </div>
          );
        })}

        {slides.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-[2]">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Слайд ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-primary-foreground" : "w-3 bg-primary-foreground/40"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PromoBanner;
