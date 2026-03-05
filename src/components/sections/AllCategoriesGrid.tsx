import { Link } from "react-router-dom";

interface Category {
  slug: string;
  name: string;
  count: number;
  image: string;
}

const categories: Category[] = [
  {
    slug: "verkhnyaya-odezhda",
    name: "Верхняя одежда",
    count: 1240,
    image: "/hero-1.jpg",
  },
  {
    slug: "obuv",
    name: "Обувь",
    count: 890,
    image: "/product-3.jpg",
  },
  {
    slug: "sumki",
    name: "Сумки и рюкзаки",
    count: 560,
    image: "/product-4.jpg",
  },
  {
    slug: "platya",
    name: "Платья",
    count: 720,
    image: "/hero-2.jpg",
  },
  {
    slug: "sportivnaya",
    name: "Спортивная одежда",
    count: 430,
    image: "/product-5.jpg",
  },
  {
    slug: "aksessuary",
    name: "Аксессуары",
    count: 980,
    image: "/product-6.jpg",
  },
  {
    slug: "dzhinsy",
    name: "Джинсы",
    count: 340,
    image: "/product-3.jpg",
  },
  {
    slug: "kostyumy",
    name: "Костюмы",
    count: 215,
    image: "/hero-2.jpg",
  },
  {
    slug: "futbolki",
    name: "Футболки",
    count: 1890,
    image: "/product-5.jpg",
  },
];

const AllCategoriesGrid = () => {
  const formatCount = (count: number) => {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">ВСЕ КАТЕГОРИИ</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            to={`/category/${category.slug}`}
            className="group relative h-[120px] md:h-[140px] rounded-xl overflow-hidden"
          >
            <img
              src={category.image}
              alt={category.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/45 group-hover:bg-foreground/55 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <div>
                <h3 className="text-base font-bold text-primary-foreground">
                  {category.name}
                </h3>
                <p className="text-xs text-primary-foreground/70">
                  {formatCount(category.count)} товаров
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default AllCategoriesGrid;
