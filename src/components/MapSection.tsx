import { useEffect, useRef, useState } from "react";

const YANDEX_API_KEY = "a79c56f4-efea-471e-bee5-fe9226cd53fd";
const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173];
const IFRAME_FALLBACK = "https://yandex.ru/maps/embed?pt=37.6173,55.7558&z=13&l=map";

declare global {
  interface Window {
    ymaps?: {
      ready: (cb: () => void) => void;
      Map: new (element: string | HTMLElement, state: { center: number[]; zoom: number }) => unknown;
      Placemark: new (coords: number[], properties?: object, options?: object) => unknown;
      geoObjects: { add: (obj: unknown) => void };
    };
  }
}

const MapSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsVisible(true);
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || useFallback) return;

    const scriptId = "yandex-maps-api";
    if (document.getElementById(scriptId)) {
      if (window.ymaps) {
        window.ymaps.ready(initMap);
      } else {
        setUseFallback(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(initMap);
      } else {
        setUseFallback(true);
      }
    };
    script.onerror = () => setUseFallback(true);
    document.head.appendChild(script);

    function initMap() {
      if (!containerRef.current || !window.ymaps) {
        setUseFallback(true);
        return;
      }
      try {
        const map = new window.ymaps.Map(containerRef.current, {
          center: MOSCOW_CENTER,
          zoom: 13,
        }) as unknown as { geoObjects: { add: (obj: unknown) => void } };
        const placemark = new window.ymaps.Placemark(MOSCOW_CENTER);
        map.geoObjects.add(placemark);
      } catch {
        setUseFallback(true);
      }
    }
  }, [isVisible, useFallback]);

  return (
    <section className="mb-10">
      <div className="w-full h-[400px] rounded-2xl overflow-hidden bg-secondary border border-border">
        {useFallback ? (
          <iframe
            title="Яндекс.Карты — Москва"
            src={IFRAME_FALLBACK}
            width="100%"
            height="400"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
            className="block w-full h-full"
          />
        ) : (
          <div ref={containerRef} className="w-full h-full min-h-[400px]" />
        )}
      </div>
    </section>
  );
};

export default MapSection;
