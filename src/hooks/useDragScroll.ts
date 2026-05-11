import { useRef, useEffect, RefObject } from "react";

/**
 * Горизонтальные слайдеры: перетаскивание мышью и свайп (Pointer Events — единые для touch/stylus).
 * Колёсико мыши при наведении прокручивает по горизонтали.
 */
export const useDragScroll = <T extends HTMLElement>(): RefObject<T | null> => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.cursor = "grab";
    /** Горизонтальная прокрутка жестами, вертикаль не блокируется на родителе там, где возможно */
    el.style.touchAction = "pan-x pinch-zoom";

    let activeId: number | null = null;
    let startX = 0;
    let scrollAtStart = 0;
    let dragging = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activeId = e.pointerId;
      startX = e.clientX;
      scrollAtStart = el.scrollLeft;
      dragging = false;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activeId || activeId === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) dragging = true;
      if (!dragging) return;
      e.preventDefault();
      el.scrollLeft = scrollAtStart - dx;
      el.style.cursor = "grabbing";
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerId !== activeId || activeId === null) return;
      activeId = null;
      dragging = false;
      el.style.cursor = "grab";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onWheel = (e: WheelEvent) => {
      const canHorizontal = el.scrollWidth > el.clientWidth;
      if (!canHorizontal) return;
      const mostlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (mostlyVertical) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("lostpointercapture", onPointerEnd);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("lostpointercapture", onPointerEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return ref;
};
