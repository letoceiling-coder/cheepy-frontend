import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  slug: string;
  name: string;
  count: number;
  /** Если пусто — скелетон вместо мокового фото. */
  image: string | null;
}

const CategoryCard = ({ slug, name, count, image }: CategoryCardProps) => {
  return (
    <Link to={`/category/${slug}`} className="group flex flex-col items-center gap-3 min-w-[160px] px-4 py-3">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-foreground/5 transition-transform duration-300 group-hover:scale-105">
        {image ? (
          <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" aria-hidden />
        )}
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-semibold text-primary-foreground">{name}</span>
        <span className="flex items-center gap-1.5 text-xs text-primary-foreground/60">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
          {count} товаров
        </span>
      </div>
      <ArrowRight className="w-4 h-4 text-primary-foreground/50 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
};

export default CategoryCard;
