import { useMemo, useState } from "react";
import { Shirt, Footprints, Tag, Grid2X2, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

interface MegaMenuProps {
  categories: PublicMenuCategory[];
  onClose: () => void;
}

export type PublicMenuCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  products_count?: number;
  children?: PublicMenuCategory[];
};

const categoryIconByIndex = [Shirt, Footprints, Tag];

const MegaMenu = ({ categories, onClose }: MegaMenuProps) => {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(categories[0]?.id ?? null);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null,
    [activeCategoryId, categories]
  );
  const topTabs = useMemo(() => categories.slice(0, 6), [categories]);
  const groupedChildren = useMemo(() => {
    if (!activeCategory) return [];
    const children = activeCategory.children ?? [];
    const groups: Array<{ title: string; items: PublicMenuCategory[] }> = [];
    for (let i = 0; i < children.length; i += 4) {
      const chunk = children.slice(i, i + 4);
      groups.push({
        title: chunk[0]?.name ?? "Категории",
        items: chunk,
      });
    }
    return groups;
  }, [activeCategory]);

  return (
    <div className="absolute left-0 right-0 top-full bg-popover border-t border-border animate-slide-down z-[1100]">
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Top tabs */}
        <div className="flex gap-2 mb-4">
          {topTabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/category/${tab.slug}`}
              className="px-4 py-1.5 text-sm rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-foreground"
              onClick={onClose}
            >
              {tab.name}
            </Link>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Left sidebar */}
          <div className="w-[200px] shrink-0">
            <button className="w-full gradient-primary text-primary-foreground rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-semibold mb-3" type="button">
              <Grid2X2 className="w-4 h-4" />
              Все товары
            </button>
            <div className="space-y-0.5">
              {categories.map((cat, i) => {
                const Icon = categoryIconByIndex[i % categoryIconByIndex.length];
                return (
                  <button
                    key={cat.id}
                    onMouseEnter={() => setActiveCategoryId(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      activeCategory?.id === cat.id ? "bg-secondary text-primary font-medium" : "text-foreground hover:bg-secondary"
                    }`}
                    type="button"
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
              <h3 className="text-xl font-bold text-foreground">{activeCategory?.name ?? "Категории"}</h3>
              <span className="text-sm text-primary">● {activeCategory?.products_count ?? 0} товаров</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {groupedChildren.map((sub, i) => (
                <div key={`${activeCategory?.id ?? "root"}-${i}`} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <h4 className="font-semibold text-foreground mb-2">{sub.title}</h4>
                  <ul className="space-y-1.5">
                    {sub.items.map((item) => (
                      <li key={item.id}>
                        <Link to={`/category/${item.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors" onClick={onClose}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button className="text-sm text-primary mt-2 flex items-center gap-1 hover:underline" type="button">
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
