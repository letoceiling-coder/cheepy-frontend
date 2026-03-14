import { useParams, Link } from "react-router-dom";
import { ChevronRight, Shield, Truck, RotateCcw, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { brandsData } from "@/data/marketplaceData";
import { mockProducts } from "@/data/mock-data";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  truck: Truck,
  rotate: RotateCcw,
  star: Star,
};

const BrandPage = () => {
  const { slug } = useParams();
  const brand = brandsData.find(b => b.slug === slug) || brandsData[0];
  const brandProducts = mockProducts.slice(0, 12);

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/category/all" className="hover:text-primary transition-colors">Бренды</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{brand.name}</span>
        </div>

        {/* Hero */}
        <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-background/20 flex items-center justify-center text-4xl md:text-5xl font-extrabold">
              {brand.logo}
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-1">{brand.name}</h1>
              <p className="text-sm opacity-80 mb-3">{brand.description}</p>
              <p className="text-sm opacity-60">{brand.productCount} товаров в каталоге</p>
            </div>
          </div>
          <Link
            to={`/category/${brand.slug}`}
            className="inline-block mt-6 bg-background text-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Перейти к каталогу
          </Link>
        </div>

        {/* About */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">О бренде</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-foreground text-sm leading-relaxed mb-4">{brand.history}</p>
              <div className="flex flex-wrap gap-3">
                {brand.advantages.map(a => (
                  <span key={a} className="px-4 py-2 bg-secondary rounded-full text-sm text-foreground font-medium">{a}</span>
                ))}
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Сертификаты</h3>
              <div className="space-y-2">
                {brand.certificates.map(c => (
                  <div key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Популярные товары {brand.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {brandProducts.map(p => (
              <Link key={p.id} to={`/product/${p.id}`}>
                <ProductCard product={p} />
              </Link>
            ))}
          </div>
        </section>

        {/* Why choose */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Почему выбирают {brand.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brand.whyChoose.map((item, i) => {
              const Icon = iconMap[item.icon] || Shield;
              return (
                <div key={i} className="bg-secondary rounded-xl p-5 text-center">
                  <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEO text */}
        <section className="mb-10">
          <div className="bg-secondary rounded-xl p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{brand.seoText}</p>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BrandPage;
