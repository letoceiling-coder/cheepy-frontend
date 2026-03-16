import { useState } from "react";
import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import hero1 from "@/assets/hero-1.jpg";

const categories = ["Все", "Мода", "Стиль", "Советы", "Новости"];

const posts = [
  { title: "Тренды весна-лето 2025", excerpt: "Главные модные тенденции нового сезона: что носить и с чем сочетать.", image: hero1, cat: "Мода", date: "5 марта 2026" },
  { title: "Как выбрать идеальные кроссовки", excerpt: "Руководство по выбору кроссовок для разных целей: бег, тренировки, повседневная носка.", image: product2, cat: "Советы", date: "28 февраля 2026" },
  { title: "5 базовых вещей в гардеробе", excerpt: "Минимальный набор одежды, который подойдёт для любого случая.", image: product3, cat: "Стиль", date: "20 февраля 2026" },
  { title: "Cheepy запускает экспресс-доставку", excerpt: "Теперь доставка за 1 день доступна в 15 крупнейших городах России.", image: product4, cat: "Новости", date: "15 февраля 2026" },
  { title: "Как ухаживать за кожаными изделиями", excerpt: "Советы по уходу за сумками, обувью и аксессуарами из натуральной кожи.", image: product5, cat: "Советы", date: "10 февраля 2026" },
  { title: "Осенние образы от стилистов Cheepy", excerpt: "Подборка готовых луков для осени от наших стилистов.", image: product1, cat: "Стиль", date: "5 февраля 2026" },
];

const BlogPage = () => {
  const [active, setActive] = useState("Все");
  const filtered = active === "Все" ? posts : posts.filter((p) => p.cat === active);

  return (
    <InfoPageLayout>
      <PageHero
        title="Блог"
        subtitle="Статьи о моде, стиле и новостях маркетплейса"
        breadcrumb={[{ label: "Главная", to: "/" }, { label: "Блог" }]}
      />
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${active === c ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {filtered.map((p, i) => (
          <SectionFadeIn key={i}>
            <div className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group h-full flex flex-col">
              <div className="aspect-video overflow-hidden">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.cat}</span>
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{p.excerpt}</p>
                <span className="flex items-center gap-1 text-primary text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                  Читать далее <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </SectionFadeIn>
        ))}
      </div>
    </InfoPageLayout>
  );
};

export default BlogPage;
