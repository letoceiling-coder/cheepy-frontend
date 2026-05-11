import { useRef, useEffect, RefObject } from "react";

/**
 * Лёгкий свайп влево/вправо для каруселей без «дорожки» (fade / одна страница).
 * Свайп пальца влево (контент уезжает влево) → следующий слайд.
 */
export type UseSwipeSlidesOpts = {
  onSwipePrev: () => void;
  onSwipeNext: () => void;
  /** Минимальное горизонтальное смещение px */
  thresholdPx?: number;
};

export function useSwipeSlides(opts: UseSwipeSlidesOpts): RefObject<HTMLDivElement | null> {
  const { onSwipePrev, onSwipeNext, thresholdPx = 52 } = opts;
  const ref = useRef<HTMLDivElement | null>(null);
  const onPrevRef = useRef(onSwipePrev);
  const onNextRef = useRef(onSwipeNext);
  onPrevRef.current = onSwipePrev;
  onNextRef.current = onSwipeNext;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x0 = 0;
    let y0 = 0;
    let active = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      active = true;
      x0 = e.clientX;
      y0 = e.clientY;
    };

    const up = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) < thresholdPx || Math.abs(dx) < Math.abs(dy) * 0.75) return;
      if (dx < 0) onNextRef.current();
      else onPrevRef.current();
    };

    const cancel = () => {
      active = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
    };
  }, [thresholdPx]);

  return ref;
}
