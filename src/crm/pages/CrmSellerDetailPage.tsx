import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { DataTable, type Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Star,
  Ban,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { PermissionGate } from "../rbac/PermissionGate";
import {
  sellersApi,
  adminSystemProductsApi,
  ApiError,
  resolveCrmMediaAssetUrl,
  type SystemProductItem,
} from "@/lib/api";
import { toast } from "sonner";

const fmtInt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

function formatDateRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Статус в БД → бейдж как в списке CRM (`/crm/catalog-sellers`). */
function mapSellerCrmStatus(status: string): string {
  if (status === "hidden") return "inactive";
  if (status === "active" || status === "blocked") return status;
  return "moderation";
}

function thumbnailSrc(raw: string | null | undefined): string {
  const u = String(raw || "").trim();
  if (!u) return "";
  const resolved = /^https?:\/\//i.test(u) ? u : resolveCrmMediaAssetUrl(u);
  if (typeof window !== "undefined" && window.location.protocol === "https:" && resolved.startsWith("http://")) {
    return resolved.replace(/^http:\/\//i, "https://");
  }
  return resolved;
}

function ThumbCell({ url }: { url: string | null | undefined }) {
  const src = thumbnailSrc(url || "");
  if (!src) {
    return <div className="h-10 w-10 rounded bg-muted shrink-0" />;
  }
  return (
    <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0 border border-border/50">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

const PRODUCTS_PER_PAGE = 20;

export default function CrmSellerDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [productsPage, setProductsPage] = useState(1);

  const sellerId = idParam ? Number(idParam) : NaN;
  const idValid = Number.isFinite(sellerId) && sellerId > 0;

  useEffect(() => {
    setProductsPage(1);
  }, [sellerId]);

  const sellerQ = useQuery({
    queryKey: ["crm-seller-detail", sellerId],
    queryFn: () => sellersApi.get(sellerId),
    enabled: idValid,
  });

  const productsQ = useQuery({
    queryKey: ["crm-seller-products", sellerId, productsPage],
    queryFn: () =>
      adminSystemProductsApi.list({
        seller_ids: [sellerId],
        page: productsPage,
        per_page: PRODUCTS_PER_PAGE,
        sort_by: "updated_at",
        sort_dir: "desc",
      }),
    enabled: idValid,
  });

  const updateSellerMutation = useMutation({
    mutationFn: (body: { status: string }) => sellersApi.update(sellerId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crm-seller-detail", sellerId] });
      void qc.invalidateQueries({ queryKey: ["crm-catalog-sellers"] });
      toast.success("Статус продавца обновлён");
    },
    onError: (e: Error) => {
      const msg = e instanceof ApiError ? e.message : e.message || "Не удалось обновить";
      toast.error(msg);
    },
  });

  if (!idValid) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Продавец не найден</h2>
          <Link to="/crm/sellers" className="text-sm text-primary hover:underline">
            ← Вернуться к продавцам
          </Link>
        </div>
      </div>
    );
  }

  if (sellerQ.isPending) {
    return (
      <div className="flex justify-center items-center min-h-[400px] gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        Загрузка продавца…
      </div>
    );
  }

  if (sellerQ.error) {
    const err = sellerQ.error;
    const notFound = err instanceof ApiError && err.status === 404;
    if (notFound) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Продавец не найден</h2>
            <Link to="/crm/sellers" className="text-sm text-primary hover:underline">
              ← Вернуться к продавцам
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        {err instanceof ApiError ? err.message : "Не удалось загрузить продавца."}
      </div>
    );
  }

  const seller = sellerQ.data;
  if (!seller) {
    return null;
  }

  const badgeStatus = mapSellerCrmStatus(seller.status);
  const rating =
    typeof seller.rating === "number" && !Number.isNaN(seller.rating) ? seller.rating : null;
  const avatarUrl = thumbnailSrc(seller.avatar_url || seller.avatar || null);

  const productItems = productsQ.data?.data ?? [];
  const pMeta = productsQ.data?.meta;
  const productsLastPage = pMeta?.last_page ?? 1;

  const productColumns: Column<SystemProductItem>[] = [
    {
      key: "image",
      title: "Фото",
      className: "w-14",
      render: (p) => <ThumbCell url={p.thumbnail_url} />,
    },
    { key: "name", title: "Название", render: (p) => <span className="font-medium text-sm">{p.name}</span> },
    {
      key: "category",
      title: "Категория",
      className: "hidden md:table-cell",
      render: (p) => p.category?.name ?? "—",
    },
    {
      key: "price",
      title: "Цена",
      render: (p) => {
        if (p.price) return p.price;
        if (p.price_raw != null) return `${fmtInt(p.price_raw)} ₽`;
        return "—";
      },
    },
    { key: "status", title: "Статус", render: (p) => <StatusBadge status={p.status} /> },
  ];

  const contacts = seller.contacts;
  const phone = contacts?.phone?.trim() || "—";

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/crm/sellers">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={seller.name}
          description={`ID: ${seller.id} · Slug: ${seller.slug} · С нами с ${formatDateRu(seller.created_at)}`}
          actions={
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <StatusBadge status={badgeStatus} />
              {rating != null ? (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {rating.toFixed(2)}
                </span>
              ) : null}
            </div>
          }
        />
      </div>

      {avatarUrl ? (
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-lg object-cover border border-border bg-muted"
          />
        </div>
      ) : null}

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="finance">Финансы</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="docs">Документы</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Контакты</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Телефон:</span> {phone}
                </p>
                {contacts?.whatsapp_url ? (
                  <p>
                    <span className="text-muted-foreground">WhatsApp:</span>{" "}
                    <a
                      href={contacts.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      открыть <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                ) : null}
                {contacts?.telegram_url ? (
                  <p>
                    <span className="text-muted-foreground">Telegram:</span>{" "}
                    <a
                      href={contacts.telegram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      открыть <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                ) : null}
                {contacts?.vk_url ? (
                  <p>
                    <span className="text-muted-foreground">VK:</span>{" "}
                    <a
                      href={contacts.vk_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      открыть <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                ) : null}
                {seller.source_url ? (
                  <p>
                    <span className="text-muted-foreground">Источник:</span>{" "}
                    <a
                      href={seller.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 break-all"
                    >
                      {seller.source_url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Метрики</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Товаров (парсер)</span>
                  {fmtInt(seller.products_count)}
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Верификация</span>
                  {seller.is_verified ? "Да" : "Нет"}
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Павильон</span>
                  {seller.pavilion ? (
                    <span>
                      {seller.pavilion}
                      {seller.pavilion_line ? `, линия ${seller.pavilion_line}` : ""}
                      {seller.pavilion_number ? `, №${seller.pavilion_number}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Рейтинг</span>
                  {rating != null ? rating.toFixed(2) : "—"}
                </div>
              </div>
            </div>
          </div>
          {seller.description ? (
            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Описание</h3>
              <p className="text-sm whitespace-pre-wrap">{seller.description}</p>
            </div>
          ) : null}
          {seller.seller_categories && seller.seller_categories.length > 0 ? (
            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Категории источника</h3>
              <p className="text-sm">{seller.seller_categories.join(", ")}</p>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            Сводка по выручке, комиссии и балансу продавца в CRM пока не агрегируется. Используйте разделы «Заказы» и
            «Аналитика». В списке продавцов поля заказов и выручки также ожидают подключения отчётности.
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6 space-y-4">
          {productsQ.isPending ? (
            <div className="flex justify-center py-12 gap-2 text-muted-foreground text-sm items-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Загрузка товаров каталога…
            </div>
          ) : productsQ.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
              {productsQ.error instanceof ApiError
                ? productsQ.error.message
                : "Не удалось загрузить товары продавца."}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Карточки каталога ({pMeta?.total ?? 0}). Клик по строке открывает редактор в CRM.
              </p>
              <DataTable
                data={productItems}
                columns={productColumns}
                onRowClick={(p) => navigate(`/crm/products/${p.id}`)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Страница {pMeta?.current_page ?? productsPage} из {productsLastPage} · на странице {productItems.length}{" "}
                  · всего {pMeta?.total ?? 0}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={productsPage <= 1}
                    onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                    aria-label="Предыдущая страница"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={productsPage >= productsLastPage}
                    onClick={() => setProductsPage((p) => p + 1)}
                    aria-label="Следующая страница"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            Загрузка и проверка юридических документов продавца в этой версии CRM не подключены.
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <span>Запись в каталоге продавцов</span>
              <span className="text-xs text-muted-foreground ml-auto">{formatDateRu(seller.created_at)}</span>
            </div>
            {seller.last_parsed_at ? (
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                <span>Последний парсинг</span>
                <span className="text-xs text-muted-foreground ml-auto">{formatDateRu(seller.last_parsed_at)}</span>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 bg-card border-t border-border -mx-4 md:-mx-6 px-4 md:px-6 py-3 flex items-center gap-2 justify-end flex-wrap">
        <PermissionGate permission="sellers.manage">
          {seller.status === "blocked" ? (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={updateSellerMutation.isPending}
              onClick={() => updateSellerMutation.mutate({ status: "active" })}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Снять блокировку
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive"
              disabled={updateSellerMutation.isPending}
              onClick={() => updateSellerMutation.mutate({ status: "blocked" })}
            >
              <Ban className="h-3.5 w-3.5" />
              Заблокировать
            </Button>
          )}
        </PermissionGate>
      </div>
    </div>
  );
}
