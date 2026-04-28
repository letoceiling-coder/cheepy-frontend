import { useEffect, RefObject } from "react";

/**
 * Плавно прокручивает блок квиза в область видимости при смене шага,
 * чтобы пользователь не терял фокус при выборе вариантов.
 */
export function useQuizScrollIntoView(
  ref: RefObject<HTMLElement | null>,
  step: number,
  done: boolean
) {
  useEffect(() => {
    // Avoid automatic page scroll on initial load; only scroll when user interacts (step changes after mount).
    // If the element is already in view, do nothing.
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fullyVisible = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
    if (fullyVisible) return;
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [step, done]);
}
