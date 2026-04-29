import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, Package, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { resolveCrmMediaAssetUrl } from "@/lib/api";
import { usePublicSellersInfinite, type SellersSort } from "@/hooks/usePublicSellers";

const SORT_OPTIONS: { value: SellersSort; label: string }[] = [
  { value: "products_desc", label: "Сначала с большим каталогом" },
  { value: "name_asc", label: "По имени А→Я" },
  { value: "reviews_desc", label: "По числу отзывов" },
  { value: "newest", label: "Новые на площадке" },
];

function formatAvg(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  const s = v.toFixed(1).replace(/\.0$/, "");
  return s;
}

const SellersListPage = () => {
  const [sortBy, setSortBy] = useState<SellersSort>("products_desc");
  const q = usePublicSellersInfinite(sortBy);

  const rows = useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data?.pages]);

  const total = q.data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">
            Главная
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Продавцы</span>
        </div>

        <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Все продавцы</h1>
          <p className="text-sm md:text-base opacity-80">
            Выбирайте товары от продавцов с активными карточками на витрине Cheepy
          </p>
          <p className="text-sm opacity-60 mt-2">
            {q.isPending ? "Загрузка…" : `${total} продавцев`}
          </p>
        </div>

        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-foreground">Каталог продавцов</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SellersSort)}
              className="text-sm py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full sm:w-auto max-w-md"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {q.isPending ? (
            <p className="text-sm text-muted-foreground py-8">Загрузка списка…</p>
          ) : q.isError ? (
            <p className="text-sm text-destructive py-8">Не удалось загрузить продавцов. Попробуйте обновить страницу.</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">Продавцов с активными товарами пока нет.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map((seller) => {
                  const avatarSrc = seller.avatar_url ? resolveCrmMediaAssetUrl(seller.avatar_url) : "";
                  const avg = formatAvg(seller.reviews_summary?.avg_rating ?? null);
                  const rs = seller.reviews_summary;

                  return (
                    <Link
                      key={seller.id}
                      to={`/seller/${seller.slug}`}
                      className="group flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all"
                    >
                      <div className="relative shrink-0">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                            {(seller.name || "?")[0]?.toUpperCase()}
                          </div>
                        )}
                        {avg != null ? (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[1.5rem] px-1 h-6 flex items-center justify-center">
                            {avg}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground mb-1 break-words">{seller.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-1">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 shrink-0" />
                            {rs?.count ?? 0} отзывов
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3 shrink-0" />
                            {seller.products_count} товаров
                          </span>
                        </div>
                        {avg != null && rs?.positive_percent != null ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="flex items-center gap-0.5 text-foreground">
                              <Star className="w-3 h-3 fill-accent text-accent shrink-0" />
                              {avg}
                            </span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {rs.positive_percent}% оценок 4★+
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {q.hasNextPage ? (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    disabled={q.isFetchingNextPage}
                    onClick={() => void q.fetchNextPage()}
                    className="text-sm font-medium text-primary border border-primary/40 rounded-full px-6 py-2 hover:bg-primary/10 disabled:opacity-50"
                  >
                    {q.isFetchingNextPage ? "Загрузка…" : "Показать ещё"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="mb-10">
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">О продавцах на площадке</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Здесь перечислены только продавцы с активными карточками каталога. Отзывы и рейтинги считаются по данным,
              оставленным покупателями на Cheepy.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SellersListPage;
