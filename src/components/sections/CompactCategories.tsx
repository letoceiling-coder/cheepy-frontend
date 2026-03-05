import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { popularCategories } from "@/data/marketplaceData";

const CompactCategories = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">КОМПАКТНЫЕ КАТЕГОРИИ</h2>
      
      <div className="flex flex-wrap gap-2">
        {popularCategories.map((category) => (
          <Link
            key={category.slug}
            to={`/category/${category.slug}`}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <img
              src={category.image}
              alt={category.name}
              className="w-8 h-8 rounded-full object-cover"
              loading="lazy"
            />
            <span className="text-sm font-medium text-foreground">{category.name}</span>
            <span className="text-xs text-muted-foreground">{category.count}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CompactCategories;
