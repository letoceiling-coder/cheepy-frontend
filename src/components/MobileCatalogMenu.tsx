import { useEffect, useState } from "react";
import { X, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { publicApi } from "@/lib/api";
import CategoryIcon from "./CategoryIcon";

interface MobileCatalogMenuProps {
  open: boolean;
  onClose: () => void;
}

type MenuCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  children?: MenuCategory[];
};

const MobileCatalogMenu = ({ open, onClose }: MobileCatalogMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    publicApi
      .menu()
      .then((res) => {
        if (!mounted) return;
        setCategories(Array.isArray(res.categories) ? (res.categories as MenuCategory[]) : []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, [open]);

  const handleBack = () => setActiveCategory(null);

  const handleClose = () => {
    setActiveCategory(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-foreground/40 z-[2000]" onClick={handleClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 w-[85vw] max-w-[360px] bg-background z-[2001] flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {activeCategory ? (
            <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          ) : (
            <span className="text-base font-bold text-foreground">Категории</span>
          )}
          <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!activeCategory ? (
            <div className="py-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if ((cat.children ?? []).length > 0) {
                      setActiveCategory(cat);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <CategoryIcon icon={cat.icon || "grid"} className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left">{cat.name}</span>
                  {(cat.children ?? []).length > 0 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2 animate-slide-in-right">
              <Link
                to={`/category/${activeCategory.slug}`}
                onClick={handleClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-primary border-b border-border"
              >
                <CategoryIcon icon={activeCategory.icon || "grid"} className="w-5 h-5" />
                Все в "{activeCategory.name}"
              </Link>
              {(activeCategory.children ?? []).map((sub) => (
                <Link
                  key={sub.slug}
                  to={`/category/${sub.slug}`}
                  onClick={handleClose}
                  className="block px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors pl-12"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileCatalogMenu;
