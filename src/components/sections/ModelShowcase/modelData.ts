import v1 from "@/assets/models/videos/model-turn-1.mp4";
import v2 from "@/assets/models/videos/model-turn-2.mp4";
import v3 from "@/assets/models/videos/model-turn-3.mp4";
import v4 from "@/assets/models/videos/model-turn-4.mp4";
import v5 from "@/assets/models/videos/model-turn-5.mp4";
import v6 from "@/assets/models/videos/model-turn-6.mp4";

export interface ModelProduct {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image?: string;
  videoSrc: string;
}

export const allModels: ModelProduct[] = [
  { id: 101, name: "Тренч классический бежевый", price: 12990, oldPrice: 18990, videoSrc: v1 },
  { id: 102, name: "Кожаная куртка чёрная", price: 16990, oldPrice: 22990, videoSrc: v2 },
  { id: 103, name: "Платье вечернее изумрудное", price: 9990, oldPrice: 14990, videoSrc: v3 },
  { id: 104, name: "Костюм тёмно-синий", price: 24990, oldPrice: 32990, videoSrc: v4 },
  { id: 105, name: "Свитер оверсайз кремовый", price: 5990, oldPrice: 8490, videoSrc: v5 },
  { id: 106, name: "Блейзер коралловый", price: 11990, oldPrice: 15990, videoSrc: v6 },
];

// Shuffle helper
export const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
