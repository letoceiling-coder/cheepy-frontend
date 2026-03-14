import model1 from "@/assets/models/model-1.jpg";
import model2 from "@/assets/models/model-2.jpg";
import model3 from "@/assets/models/model-3.jpg";
import model4 from "@/assets/models/model-4.jpg";
import model5 from "@/assets/models/model-5.jpg";
import model6 from "@/assets/models/model-6.jpg";

export interface ModelProduct {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
}

export const allModels: ModelProduct[] = [
  { id: 101, name: "Тренч классический бежевый", price: 12990, oldPrice: 18990, image: model1 },
  { id: 102, name: "Кожаная куртка чёрная", price: 16990, oldPrice: 22990, image: model2 },
  { id: 103, name: "Платье вечернее изумрудное", price: 9990, oldPrice: 14990, image: model3 },
  { id: 104, name: "Костюм тёмно-синий", price: 24990, oldPrice: 32990, image: model4 },
  { id: 105, name: "Свитер оверсайз кремовый", price: 5990, oldPrice: 8490, image: model5 },
  { id: 106, name: "Блейзер коралловый", price: 11990, oldPrice: 15990, image: model6 },
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
