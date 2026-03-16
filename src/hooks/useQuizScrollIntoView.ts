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
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [step, done]);
}
