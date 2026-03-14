import { useState } from "react";
import { Shirt, Footprints, Tag, Grid2X2, ChevronDown } from "lucide-react";

interface MegaMenuProps {
  onClose: () => void;
}

const categories = [
  { name: "Все товары", icon: Grid2X2 },
  { name: "Одежда", icon: Shirt },
  { name: "Обувь", icon: Footprints },
  { name: "Категория", icon: Tag },
  { name: "Категория", icon: Tag },
  { name: "Категория", icon: Tag },
  { name: "Категория", icon: Tag },
  { name: "Категория", icon: Tag },
  { name: "Категория", icon: Tag },
  { name: "Категория", icon: Tag },
];

const subcategories: Record<string, { title: string; items: string[] }[]> = {
  "Одежда": [
    { title: "Мужчинам", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Для детей", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Для детей", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Для детей", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Женщинам", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Спец одежда", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Спец одежда", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
    { title: "Спец одежда", items: ["Футболки и майки", "Брюки", "Шорты", "Джинсы"] },
  ],
  "Все товары": [
    { title: "Мужское", items: ["Одежда", "Обувь", "Аксессуары"] },
    { title: "Женское", items: ["Одежда", "Обувь", "Аксессуары"] },
    { title: "Детское", items: ["Одежда", "Обувь", "Аксессуары"] },
    { title: "Товары для дома", items: ["Текстиль", "Декор", "Кухня"] },
  ],
};

const MegaMenu = ({ onClose }: MegaMenuProps) => {
  const [activeCategory, setActiveCategory] = useState("Одежда");

  const activeSubs = subcategories[activeCategory] || subcategories["Одежда"];
  const topTabs = ["Мужское", "Женское", "Обувь и одежда", "Детская одежда", "Аксессуары", "Товары для дома"];

  return (
    <div className="absolute left-0 right-0 top-full bg-popover border-t border-border animate-slide-down z-[1100]">
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Top tabs */}
        <div className="flex gap-2 mb-4">
          {topTabs.map(tab => (
            <button key={tab} className="px-4 py-1.5 text-sm rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-foreground">
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Left sidebar */}
          <div className="w-[200px] shrink-0">
            <button className="w-full gradient-primary text-primary-foreground rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-semibold mb-3">
              <Grid2X2 className="w-4 h-4" />
              Все товары
            </button>
            <div className="space-y-0.5">
              {categories.slice(1).map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setActiveCategory(cat.name)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      activeCategory === cat.name ? "bg-secondary text-primary font-medium" : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-foreground">{activeCategory}</h3>
              <span className="text-sm text-primary">● 120 126 товаров</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {activeSubs?.map((sub, i) => (
                <div key={`${activeCategory}-${i}`} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <h4 className="font-semibold text-foreground mb-2">{sub.title}</h4>
                  <ul className="space-y-1.5">
                    {sub.items.map((item, j) => (
                      <li key={j}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <button className="text-sm text-primary mt-2 flex items-center gap-1 hover:underline">
                    Ещё <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
