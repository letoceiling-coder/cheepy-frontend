import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import type { StorefrontProduct } from "@/types/storefront-product";

/** @deprecated Используйте StorefrontProduct из @/types/storefront-product */
export type Product = StorefrontProduct;

export interface Order {
  id: string;
  date: string;
  status: "shipped" | "delivered" | "cancelled";
  total: number;
  discount: number;
  delivery: number;
  items: { product: Product; quantity: number; color: string; size: string }[];
  address: string;
  payment: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percent" | "fixed";
  expiresAt: string;
  used: boolean;
  minOrder?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  avatar: string;
  balance: number;
  referralCode: string;
  addresses: string[];
  pvzAddresses: string[];
}

export interface NewsItem {
  id: number;
  title: string;
  date: string;
  image: string;
  category: string;
  excerpt: string;
}

const images = [product1, product2, product3, product4, product5, product6];

export const mockProducts: Product[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: [
    "Куртка демисезонная удлинённая",
    "Кроссовки беговые Air Max",
    "Платье вечернее с пайетками",
    "Рюкзак городской кожаный",
    "Джинсы slim fit тёмно-синие",
    "Свитшот оверсайз хлопковый",
    "Пальто шерстяное классическое",
    "Сумка тоут из экокожи",
    "Футболка базовая белая",
    "Ботинки челси замшевые",
    "Юбка миди плиссированная",
    "Шорты спортивные",
  ][i % 12],
  price: [4990, 8990, 12990, 3490, 5990, 2990, 15990, 4290, 1290, 9990, 3790, 1990][i % 12],
  oldPrice: i % 3 === 0 ? [6990, 12990, 17990, 4990, 8990, 4290, 21990, 5990, 1990, 13990, 5290, 2990][i % 12] : undefined,
  images: [images[i % 6], images[(i + 1) % 6], images[(i + 2) % 6], images[(i + 3) % 6], images[(i + 4) % 6], images[(i + 5) % 6]],
  rating: +(3.5 + Math.random() * 1.5).toFixed(1),
  reviews: 10 + Math.floor(Math.random() * 500),
  seller: ["Fashion Hub", "SportStyle", "Glamour Shop", "UrbanBag", "DenimPro", "ComfortWear"][i % 6],
  category: ["Верхняя одежда", "Обувь", "Платья", "Сумки", "Джинсы", "Свитшоты", "Верхняя одежда", "Сумки", "Футболки", "Обувь", "Юбки", "Шорты"][i % 12],
  description: "Стильная и качественная вещь из новой коллекции. Подходит для повседневной носки и особых случаев. Выполнена из натуральных материалов с вниманием к деталям.",
  colors: ["Чёрный", "Белый", "Синий", "Серый", "Бежевый"].slice(0, 2 + (i % 3)),
  sizes: ["XS", "S", "M", "L", "XL"].slice(i % 2, 3 + (i % 3)),
  material: ["Хлопок", "Полиэстер", "Шерсть", "Экокожа", "Замша", "Деним"][i % 6],
  brand: ["Nike", "Zara", "H&M", "Mango", "Uniqlo", "Levi's"][i % 6],
}));

export const mockOrders: Order[] = [
  {
    id: "ORD-2024-001",
    date: "2024-12-15",
    status: "delivered",
    total: 13980,
    discount: 2000,
    delivery: 0,
    items: [
      { product: mockProducts[0], quantity: 1, color: "Чёрный", size: "M" },
      { product: mockProducts[1], quantity: 1, color: "Белый", size: "42" },
    ],
    address: "Москва, ул. Пушкина, д. 10, кв. 5",
    payment: "Банковская карта **** 4242",
  },
  {
    id: "ORD-2024-002",
    date: "2024-12-20",
    status: "shipped",
    total: 5990,
    discount: 0,
    delivery: 299,
    items: [
      { product: mockProducts[4], quantity: 1, color: "Синий", size: "L" },
    ],
    address: "Москва, ПВЗ на ул. Ленина, 25",
    payment: "Банковская карта **** 1234",
  },
  {
    id: "ORD-2024-003",
    date: "2024-11-05",
    status: "cancelled",
    total: 2990,
    discount: 500,
    delivery: 0,
    items: [
      { product: mockProducts[5], quantity: 1, color: "Серый", size: "XL" },
    ],
    address: "Москва, ул. Гагарина, д. 3",
    payment: "Баланс",
  },
];

export const mockCoupons: Coupon[] = [
  { id: "1", code: "WELCOME10", discount: 10, type: "percent", expiresAt: "2025-06-01", used: false },
  { id: "2", code: "SALE500", discount: 500, type: "fixed", expiresAt: "2025-03-15", used: false, minOrder: 3000 },
  { id: "3", code: "SPRING20", discount: 20, type: "percent", expiresAt: "2025-04-01", used: true },
];

export const mockUser: UserProfile = {
  name: "Александр Иванов",
  email: "alex@example.com",
  phone: "+7 (999) 123-45-67",
  birthday: "1990-05-15",
  avatar: "",
  balance: 2500,
  referralCode: "CHEEPY-AX7K2",
  addresses: ["Москва, ул. Пушкина, д. 10, кв. 5", "Москва, ул. Гагарина, д. 3"],
  pvzAddresses: ["ПВЗ на ул. Ленина, 25", "ПВЗ в ТЦ «Мега»"],
};

export const mockCategories = [
  "Верхняя одежда", "Платья", "Футболки", "Джинсы", "Обувь",
  "Сумки", "Аксессуары", "Свитшоты", "Юбки", "Шорты",
  "Костюмы", "Белье",
];

export const mockSubcategories: Record<string, string[]> = {
  "Верхняя одежда": ["Куртки", "Пальто", "Пуховики", "Ветровки", "Тренчи"],
  "Платья": ["Вечерние", "Повседневные", "Коктейльные", "Макси", "Мини"],
  "Обувь": ["Кроссовки", "Ботинки", "Туфли", "Сандалии", "Кеды"],
  "Сумки": ["Тоут", "Рюкзаки", "Клатчи", "Поясные", "Шопперы"],
};

export const mockBalanceHistory = [
  { id: 1, date: "2024-12-20", type: "credit" as const, amount: 500, description: "Кэшбек за заказ ORD-2024-002" },
  { id: 2, date: "2024-12-15", type: "debit" as const, amount: 1000, description: "Оплата заказа ORD-2024-001" },
  { id: 3, date: "2024-12-01", type: "credit" as const, amount: 3000, description: "Пополнение баланса" },
];

export const mockReceipts = [
  { id: "REC-001", date: "2024-12-15", amount: 13980, orderId: "ORD-2024-001" },
  { id: "REC-002", date: "2024-12-20", amount: 6289, orderId: "ORD-2024-002" },
];
