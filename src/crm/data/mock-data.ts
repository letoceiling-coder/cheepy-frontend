// CRM Mock Data

export interface CrmProduct {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  seller: string;
  sellerId: string;
  price: number;
  oldPrice?: number;
  stock: number;
  status: 'active' | 'draft' | 'archived' | 'moderation';
  rating: number;
  reviews: number;
  sku: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmOrder {
  id: string;
  number: string;
  userId: string;
  userName: string;
  sellerId: string;
  sellerName: string;
  items: { productId: string; title: string; qty: number; price: number }[];
  total: number;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment: 'paid' | 'pending' | 'failed' | 'refunded';
  delivery: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  comment?: string;
}

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'seller' | 'moderator' | 'admin';
  status: 'active' | 'blocked' | 'inactive';
  orders: number;
  totalSpent: number;
  balance: number;
  registeredAt: string;
  lastActive: string;
}

export interface CrmSeller {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'moderation' | 'blocked' | 'inactive';
  rating: number;
  products: number;
  orders: number;
  revenue: number;
  commission: number;
  balance: number;
  documents: boolean;
  complaints: number;
  joinedAt: string;
}

export interface CrmReview {
  id: string;
  productId: string;
  productTitle: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  status: 'published' | 'moderation' | 'rejected';
  sellerReply?: string;
  complaints: number;
  createdAt: string;
}

export interface CrmPromotion {
  id: string;
  name: string;
  type: 'coupon' | 'banner' | 'flash_sale' | 'category_discount' | 'personal';
  status: 'active' | 'scheduled' | 'ended' | 'draft';
  discount: number;
  discountType: 'percent' | 'fixed';
  code?: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number;
}

// ── Helpers ──
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const date = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const firstNames = ['Александр','Мария','Дмитрий','Елена','Сергей','Анна','Иван','Ольга','Артём','Наталья','Максим','Татьяна','Андрей','Екатерина','Михаил','Юлия','Николай','Светлана','Павел','Виктория'];
const lastNames = ['Иванов','Петрова','Сидоров','Козлова','Смирнов','Новикова','Морозов','Волкова','Лебедев','Соколова','Кузнецов','Попова','Васильев','Федорова','Зайцев','Егорова','Павлов','Орлова','Семенов','Макарова'];
const cities = ['Москва','Санкт-Петербург','Казань','Новосибирск','Екатеринбург','Краснодар','Нижний Новгород','Самара','Ростов-на-Дону','Воронеж'];
const sellerNames = ['Fashion Hub','SportStyle','Glamour Shop','UrbanBag','DenimPro','ComfortWear','TrendLine','StylePoint','ModaPlus','LuxBrands'];
const categoryNames = ['Верхняя одежда','Платья','Футболки','Джинсы','Обувь','Сумки','Аксессуары','Свитшоты','Юбки','Шорты','Костюмы','Бельё','Головные уборы','Спортивная одежда','Украшения'];
const productTitles = ['Куртка демисезонная','Кроссовки беговые','Платье вечернее','Рюкзак городской','Джинсы slim fit','Свитшот оверсайз','Пальто шерстяное','Сумка тоут','Футболка базовая','Ботинки челси','Юбка миди','Шорты спортивные','Блузка шёлковая','Кардиган вязаный','Брюки классические','Толстовка с капюшоном','Жилет утеплённый','Сандалии кожаные','Бомбер атласный','Лоферы замшевые','Комбинезон джинсовый','Топ кроп','Парка зимняя','Мокасины','Тренч классический','Пуловер кашемировый','Леггинсы спортивные','Кеды текстильные','Рубашка оверсайз','Худи флисовое','Пиджак двубортный','Слипоны','Водолазка','Бермуды','Косуха','Дафлкот','Тишотка принтовая','Чиносы','Плащ','Эспадрильи','Поло','Шуба эко','Бриджи','Слаксы','Анорак','Кюлоты','Балетки','Свитер крупной вязки','Тренировочные штаны','Оксфорды'];
const statuses: CrmProduct['status'][] = ['active','draft','archived','moderation'];
const orderStatuses: CrmOrder['status'][] = ['new','confirmed','shipped','delivered','cancelled','refunded'];
const paymentStatuses: CrmOrder['payment'][] = ['paid','pending','failed','refunded'];

// ── Products ──
export const crmProducts: CrmProduct[] = Array.from({ length: 50 }, (_, i) => ({
  id: `P${String(i + 1).padStart(4, '0')}`,
  title: productTitles[i % productTitles.length],
  category: categoryNames[i % categoryNames.length],
  subcategory: '',
  seller: sellerNames[i % sellerNames.length],
  sellerId: `S${String((i % 10) + 1).padStart(4, '0')}`,
  price: rnd(990, 29990),
  oldPrice: i % 3 === 0 ? rnd(15000, 39990) : undefined,
  stock: rnd(0, 500),
  status: statuses[i % statuses.length],
  rating: +(3 + Math.random() * 2).toFixed(1),
  reviews: rnd(0, 350),
  sku: `SKU-${rnd(10000, 99999)}`,
  image: `/images/product-${(i % 6) + 1}.jpg`,
  createdAt: date(rnd(1, 180)),
  updatedAt: date(rnd(0, 30)),
}));

// ── Sellers ──
export const crmSellers: CrmSeller[] = sellerNames.map((name, i) => ({
  id: `S${String(i + 1).padStart(4, '0')}`,
  name,
  email: `${name.toLowerCase().replace(/\s/g, '')}@mail.ru`,
  phone: `+7 (${rnd(900, 999)}) ${rnd(100, 999)}-${rnd(10, 99)}-${rnd(10, 99)}`,
  status: (['active','active','active','moderation','active','active','blocked','active','inactive','active'] as CrmSeller['status'][])[i],
  rating: +(3.5 + Math.random() * 1.5).toFixed(1),
  products: rnd(5, 120),
  orders: rnd(10, 800),
  revenue: rnd(50000, 5000000),
  commission: rnd(5, 20),
  balance: rnd(0, 500000),
  documents: i % 3 !== 2,
  complaints: rnd(0, 15),
  joinedAt: date(rnd(30, 720)),
}));

// ── Users ──
export const crmUsers: CrmUser[] = Array.from({ length: 200 }, (_, i) => {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[i % lastNames.length];
  return {
    id: `U${String(i + 1).padStart(4, '0')}`,
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@mail.ru`,
    phone: `+7 (${rnd(900, 999)}) ${rnd(100, 999)}-${rnd(10, 99)}-${rnd(10, 99)}`,
    role: (['customer','customer','customer','customer','seller','customer','moderator','customer','customer','admin'] as CrmUser['role'][])[i % 10],
    status: (['active','active','active','blocked','active','inactive','active','active','active','active'] as CrmUser['status'][])[i % 10],
    orders: rnd(0, 50),
    totalSpent: rnd(0, 500000),
    balance: rnd(0, 10000),
    registeredAt: date(rnd(1, 730)),
    lastActive: date(rnd(0, 60)),
  };
});

// ── Orders ──
export const crmOrders: CrmOrder[] = Array.from({ length: 100 }, (_, i) => {
  const user = crmUsers[i % crmUsers.length];
  const seller = crmSellers[i % crmSellers.length];
  const itemCount = rnd(1, 4);
  const items = Array.from({ length: itemCount }, (_, j) => {
    const p = crmProducts[(i + j) % crmProducts.length];
    return { productId: p.id, title: p.title, qty: rnd(1, 3), price: p.price };
  });
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return {
    id: `O${String(i + 1).padStart(4, '0')}`,
    number: `ORD-${2025}-${String(i + 1).padStart(4, '0')}`,
    userId: user.id,
    userName: user.name,
    sellerId: seller.id,
    sellerName: seller.name,
    items,
    total,
    status: orderStatuses[i % orderStatuses.length],
    payment: paymentStatuses[i % paymentStatuses.length],
    delivery: pick(['Курьер','ПВЗ','Почта России','СДЭК','Boxberry']),
    address: `${pick(cities)}, ул. ${pick(['Ленина','Пушкина','Гагарина','Мира','Победы'])}, д. ${rnd(1, 100)}`,
    createdAt: date(rnd(0, 90)),
    updatedAt: date(rnd(0, 30)),
    comment: i % 5 === 0 ? 'Позвонить перед доставкой' : undefined,
  };
});

// ── Reviews ──
export const crmReviews: CrmReview[] = Array.from({ length: 60 }, (_, i) => {
  const p = crmProducts[i % crmProducts.length];
  const u = crmUsers[i % crmUsers.length];
  return {
    id: `R${String(i + 1).padStart(4, '0')}`,
    productId: p.id,
    productTitle: p.title,
    userId: u.id,
    userName: u.name,
    rating: rnd(1, 5),
    text: pick([
      'Отличное качество, рекомендую!',
      'Размер не соответствует описанию.',
      'Доставка быстрая, товар в порядке.',
      'Ткань тонкая, не стоит своих денег.',
      'Очень красиво смотрится, буду заказывать ещё.',
      'Нормально за эту цену.',
      'Пришло с дефектом, оформляю возврат.',
      'Супер! Как на фото.',
    ]),
    status: (['published','published','moderation','published','rejected'] as CrmReview['status'][])[i % 5],
    sellerReply: i % 4 === 0 ? 'Спасибо за отзыв!' : undefined,
    complaints: i % 7 === 0 ? rnd(1, 5) : 0,
    createdAt: date(rnd(0, 120)),
  };
});

// ── Promotions ──
export const crmPromotions: CrmPromotion[] = [
  { id: 'PR001', name: 'Весенняя распродажа', type: 'flash_sale', status: 'active', discount: 30, discountType: 'percent', startDate: '2025-03-01', endDate: '2025-03-15', usageCount: 342, usageLimit: 1000 },
  { id: 'PR002', name: 'WELCOME10', type: 'coupon', status: 'active', discount: 10, discountType: 'percent', code: 'WELCOME10', startDate: '2025-01-01', endDate: '2025-12-31', usageCount: 1280, usageLimit: 5000 },
  { id: 'PR003', name: 'Скидка на обувь', type: 'category_discount', status: 'active', discount: 15, discountType: 'percent', startDate: '2025-02-01', endDate: '2025-04-01', usageCount: 89, usageLimit: 500 },
  { id: 'PR004', name: 'Баннер главной', type: 'banner', status: 'active', discount: 0, discountType: 'fixed', startDate: '2025-01-15', endDate: '2025-06-01', usageCount: 0, usageLimit: 0 },
  { id: 'PR005', name: 'Flash Sale Weekend', type: 'flash_sale', status: 'scheduled', discount: 50, discountType: 'percent', startDate: '2025-03-08', endDate: '2025-03-10', usageCount: 0, usageLimit: 200 },
  { id: 'PR006', name: 'VIP скидка', type: 'personal', status: 'active', discount: 2000, discountType: 'fixed', startDate: '2025-02-01', endDate: '2025-05-01', usageCount: 15, usageLimit: 100 },
  { id: 'PR007', name: 'Летняя коллекция', type: 'banner', status: 'draft', discount: 0, discountType: 'fixed', startDate: '2025-06-01', endDate: '2025-08-31', usageCount: 0, usageLimit: 0 },
  { id: 'PR008', name: 'SALE500', type: 'coupon', status: 'ended', discount: 500, discountType: 'fixed', code: 'SALE500', startDate: '2025-01-01', endDate: '2025-02-28', usageCount: 450, usageLimit: 500 },
];

// ── Dashboard KPIs ──
export const dashboardKpis = {
  totalRevenue: 12450000,
  totalOrders: 3842,
  activeSellers: 8,
  totalUsers: 200,
  conversion: 3.2,
  avgCheck: 3240,
  topCategory: 'Верхняя одежда',
  revenueGrowth: 12.5,
  ordersGrowth: 8.3,
  usersGrowth: 15.1,
};

export const salesChartData = [
  { month: 'Сен', revenue: 820000, orders: 280 },
  { month: 'Окт', revenue: 950000, orders: 310 },
  { month: 'Ноя', revenue: 1100000, orders: 380 },
  { month: 'Дек', revenue: 1450000, orders: 520 },
  { month: 'Янв', revenue: 980000, orders: 340 },
  { month: 'Фев', revenue: 1150000, orders: 400 },
];

export const categoryAnalytics = categoryNames.slice(0, 8).map((name, i) => ({
  name,
  revenue: rnd(200000, 2000000),
  orders: rnd(50, 600),
  products: rnd(10, 200),
}));

export const topProducts = crmProducts.slice(0, 5).map(p => ({
  ...p,
  sold: rnd(50, 500),
  revenue: p.price * rnd(50, 500),
}));
