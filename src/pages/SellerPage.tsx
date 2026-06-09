import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Star, MessageCircle, CheckCircle, ThumbsUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { publicApi, ApiError, resolveCrmMediaAssetUrl } from "@/lib/api";
import { publicListProductToStorefront } from "@/lib/mapPublicProduct";
import { usePublicSeller, usePublicSellerReviews } from "@/hooks/usePublicSeller";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { value: "popular", label: "По популярности" },
  { value: "price_asc", label: "Сначала дешёвые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "new", label: "Новинки" },
  { value: "rating", label: "По рейтингу" },
] as const;

const SellerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState<string>("popular");
  const queryClient = useQueryClient();

  const sellerQuery = usePublicSeller(slug, { sortBy, page: 1 });
  const reviewsQuery = usePublicSellerReviews(slug);

  const productsSf = useMemo(() => {
    const rows = sellerQuery.data?.data ?? [];
    return rows.map(publicListProductToStorefront);
  }, [sellerQuery.data?.data]);

  const seller = sellerQuery.data?.seller;
  const rs = seller?.reviews_summary;

  const reviewMutation = useMutation({
    mutationFn: async (payload: { author_name: string; rating: number; body: string }) => {
      if (!slug) throw new Error("Нет продавца");
      return publicApi.createSellerReview(slug, payload);
    },
    onSuccess: () => {
      toast.success("Отзыв опубликован");
      void queryClient.invalidateQueries({ queryKey: ["public-seller", slug] });
      void queryClient.invalidateQueries({ queryKey: ["seller-reviews", slug] });
      setAuthorName("");
      setReviewBody("");
      setReviewRating(5);
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : "Не удалось отправить отзыв";
      toast.error(msg);
    },
  });

  const [authorName, setAuthorName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate({
      author_name: authorName.trim(),
      rating: reviewRating,
      body: reviewBody.trim(),
    });
  };

  const whatsappHref =
    seller?.contacts?.whatsapp_url && /^https?:\/\//i.test(String(seller.contacts.whatsapp_url))
      ? seller.contacts.whatsapp_url
      : seller?.contacts?.whatsapp_number
        ? `https://wa.me/${String(seller.contacts.whatsapp_number).replace(/\D/g, "")}`
        : null;

  const registeredLabel = seller?.created_at
    ? new Date(seller.created_at).toLocaleDateString("ru-RU", { year: "numeric", month: "long" })
    : null;

  const avatarSrc = seller?.avatar_url ? resolveCrmMediaAssetUrl(seller.avatar_url) : "";

  if (sellerQuery.isPending) {
    return (
      <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="max-w-[1400px] mx-auto px-4 py-12 text-center text-muted-foreground text-sm">Загрузка…</main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (sellerQuery.isError || !seller) {
    return (
      <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="max-w-[1400px] mx-auto px-4 py-12 text-center">
          <p className="text-destructive mb-4">Продавец не найден или недоступен.</p>
          <Link to="/" className="text-primary underline text-sm">
            На главную
          </Link>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const reviewRows = reviewsQuery.data?.data ?? [];
  const avgDisplay = rs?.avg_rating != null ? rs.avg_rating.toFixed(1).replace(/\.0$/, "") : null;

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">
            Главная
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{seller.name}</span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-5">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                {(seller.name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1 break-words">{seller.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                {avgDisplay != null ? (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent shrink-0" />
                    {avgDisplay}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Нет оценок</span>
                )}
                <span>{rs?.count ?? 0} отзывов</span>
                <span>{seller.products_count ?? 0} товаров</span>
                {registeredLabel ? <span>На площадке с {registeredLabel}</span> : null}
              </div>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cheepy-btn-primary cheepy-btn-primary-sm items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Написать продавцу
                </a>
              ) : seller.contacts?.phone ? (
                <a
                  href={`tel:${seller.contacts.phone.replace(/\s/g, "")}`}
                  className="cheepy-btn-primary cheepy-btn-primary-sm items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Позвонить продавцу
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Контакт продавца не указан в каталоге.</span>
              )}
            </div>
          </div>
        </div>

        {(rs?.count ?? 0) > 0 && rs?.positive_percent != null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <ThumbsUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{rs.positive_percent}%</p>
              <p className="text-xs text-muted-foreground">Оценок 4★ и выше</p>
            </div>
          </div>
        ) : null}

        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-foreground">Товары продавца</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full sm:w-auto"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {productsSf.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет товаров в витрине.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {productsSf.map((p) => (
                <Link key={String(p.id)} to={`/product/${p.id}`}>
                  <ProductCard product={p} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Отзывы о продавце</h2>

          <form onSubmit={handleSubmitReview} className="bg-card rounded-xl border border-border p-4 mb-6 space-y-3">
            <p className="text-sm font-medium text-foreground">Оставить отзыв</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground block space-y-1">
                Ваше имя
                <input
                  required
                  maxLength={80}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground block space-y-1">
                Оценка
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} ★
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-xs text-muted-foreground block space-y-1">
              Комментарий (от 10 символов)
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="cheepy-btn-primary cheepy-btn-primary-sm disabled:opacity-50"
            >
              {reviewMutation.isPending ? "Отправка…" : "Отправить отзыв"}
            </button>
          </form>

          {reviewsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загрузка отзывов…</p>
          ) : reviewRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет отзывов — будьте первым.</p>
          ) : (
            <div className="space-y-3">
              {reviewRows.map((r) => (
                <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                        {(r.author_name || "?")[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{r.author_name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= r.rating ? "fill-yellow-500 text-yellow-500" : "text-border"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("ru-RU") : ""}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {seller.description ? (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">О продавце</h2>
            <div className="bg-secondary rounded-xl p-6">
              <p className="text-sm text-foreground leading-relaxed mb-4 whitespace-pre-wrap">{seller.description}</p>
              {(seller.contacts?.phone || seller.contacts?.whatsapp_number) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {[seller.contacts.phone, seller.contacts.whatsapp_number].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SellerPage;
