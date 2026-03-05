import { Link } from "react-router-dom";
import { Shirt, Footprints, Briefcase, Sparkles, Dumbbell, Watch } from "lucide-react";

interface Category {
  slug: string;
  name: string;
  count: number;
  icon: React.ReactNode;
}

const categories: Category[] = [
  {
    slug: "verkhnyaya-odezhda",
    name: "Верхняя одежда",
    count: 1240,
    icon: <Shirt className="w-6 h-6 text-primary" />,
  },
  {
    slug: "obuv",
    name: "Обувь",
    count: 890,
    icon: <Footprints className="w-6 h-6 text-primary" />,
  },
  {
    slug: "sumki",
    name: "Сумки и рюкзаки",
    count: 560,
    icon: <Briefcase className="w-6 h-6 text-primary" />,
  },
  {
    slug: "platya",
    name: "Платья",
    count: 720,
    icon: <Sparkles className="w-6 h-6 text-primary" />,
  },
  {
    slug: "sportivnaya",
    name: "Спортивная одежда",
    count: 430,
    icon: <Dumbbell className="w-6 h-6 text-primary" />,
  },
  {
    slug: "aksessuary",
    name: "Аксессуары",
    count: 980,
    icon: <Watch className="w-6 h-6 text-primary" />,
  },
];

const IconCategories = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">КАТЕГОРИИ</h2>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            to={`/category/${category.slug}`}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {category.icon}
            </div>
            <span className="text-sm font-medium text-foreground text-center">
              {category.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {category.count} товаров
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default IconCategories;
