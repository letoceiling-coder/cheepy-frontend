import v1 from "@/assets/models/videos/model-turn-1.mp4";
import v2 from "@/assets/models/videos/model-turn-2.mp4";
import v3 from "@/assets/models/videos/model-turn-3.mp4";
import v4 from "@/assets/models/videos/model-turn-4.mp4";
import v5 from "@/assets/models/videos/model-turn-5.mp4";
import v6 from "@/assets/models/videos/model-turn-6.mp4";

export interface ModelVideoProduct {
  id: number;
  name: string;
  price: number;
  videoSrc: string;
}

export const modelVideoProducts: ModelVideoProduct[] = [
  { id: 101, name: "Тренч классический бежевый", price: 12990, videoSrc: v1 },
  { id: 102, name: "Кожаная куртка чёрная", price: 16990, videoSrc: v2 },
  { id: 103, name: "Платье вечернее изумрудное", price: 9990, videoSrc: v3 },
  { id: 104, name: "Костюм тёмно-синий", price: 24990, videoSrc: v4 },
  { id: 105, name: "Свитер оверсайз кремовый", price: 5990, videoSrc: v5 },
  { id: 106, name: "Блейзер коралловый", price: 11990, videoSrc: v6 },
];
