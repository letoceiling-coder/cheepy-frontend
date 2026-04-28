import { useEffect, useRef, RefObject } from "react";

/**
 * Плавно прокручивает блок квиза в область видимости при смене шага.
 * НЕ срабатывает при первоначальном монтировании — только когда пользователь
 * сам меняет шаг/завершает квиз.
 */
export function useQuizScrollIntoView(
  ref: RefObject<HTMLElement | null>,
  step: number,
  done: boolean
) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [step, done]); // eslint-disable-line react-hooks/exhaustive-deps
}
