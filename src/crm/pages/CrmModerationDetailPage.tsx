import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import { PermissionGate } from "../rbac/PermissionGate";
import { adminSystemProductsApi, type SystemProductItem } from "@/lib/api";
import { toast } from "sonner";

const QK_LIST = ["admin-system-products-moderation"];

function productQueryKey(id: number) {
  return ["admin-system-products", id] as const;
}

function galleryUrls(item: SystemProductItem): string[] {
  const fromSp = (item.photos ?? []).map((p) => p.url).filter(Boolean);
  if (fromSp.length > 0) return fromSp;
  const donor = item.donor_sources?.[0]?.donor;
  if (donor?.thumbnail && typeof donor.thumbnail === "string") return [donor.thumbnail];
  const json = donor?.photos;
  if (Array.isArray(json)) {
    return json.filter((u): u is string => typeof u === "string" && u.startsWith("http"));
  }
  return [];
}

function formatDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export default function CrmModerationDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const id = idParam ? Number(idParam) : NaN;
  const validId = Number.isFinite(id) && id > 0;

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: validId ? productQueryKey(id) : ["admin-system-products", "invalid"],
    queryFn: () => adminSystemProductsApi.get(id),
    enabled: validId,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ status }: { status: "approved" | "needs_review" }) => adminSystemProductsApi.moderate(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK_LIST });
      queryClient.invalidateQueries({ queryKey: productQueryKey(id) });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Ошибка обновления");
    },
  });

  if (!validId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Некорректный ID</h2>
          <Link to="/crm/moderation" className="text-sm text-primary hover:underline">
            ← Вернуться к модерации
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold">Товар не найден</h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Не удалось загрузить данные"}
          </p>
          <Link to="/crm/moderation" className="text-sm text-primary hover:underline inline-block">
            ← Вернуться к модерации
          </Link>
        </div>
      </div>
    );
  }

  const images = galleryUrls(item);
  const sellerLabel = item.seller?.name ?? "—";
  const categoryLabel = item.category?.name ?? "—";
  const donor = item.donor_sources?.[0]?.donor;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/crm/moderation">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Модерация: ${item.name}`}
          description={`ID: ${item.id} · Обновлён: ${formatDate(item.updated_at)}`}
          actions={<StatusBadge status={item.status} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Галерея</h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.slice(0, 12).map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="aspect-square rounded-lg bg-muted bg-cover bg-center border border-border"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет изображений в каталоге / у донора</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Карточка (каталог CRM)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Название</span>
                {item.name}
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Цена</span>
                {item.price ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Категория витрины</span>
                {categoryLabel}
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Продавец</span>
                {sellerLabel}
              </div>
            </div>
            {item.description && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground text-xs block mb-1">Описание</span>
                <p className="text-sm whitespace-pre-wrap">{item.description}</p>
              </div>
            )}
          </div>

          {donor && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Источник (парсер, только просмотр)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Донор ID</span>
                  {donor.id}
                  {donor.external_id ? ` · ${donor.external_id}` : ""}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground text-xs block">Название у источника</span>
                  {donor.title ?? "—"}
                </div>
                {donor.source_url && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground text-xs block">Ссылка</span>
                    <a
                      href={donor.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm break-all hover:underline"
                    >
                      {donor.source_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {(item.attributes?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Атрибуты (снимок)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {item.attributes!.map((a, i) => (
                  <div key={`${a.attr_name}-${i}`}>
                    <span className="text-muted-foreground text-xs block">{a.attr_name}</span>
                    {a.attr_value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Статус</h3>
            <StatusBadge status={item.status} />
            <p className="text-xs text-muted-foreground pt-2">
              Решение модерации меняет только статус в каталоге CRM, без правок парсера.
            </p>
          </div>

          {item.status === "pending" && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Решение</h3>
              <div className="flex flex-col gap-2">
                <PermissionGate permission="moderation.approve">
                  <Button
                    size="sm"
                    className="gap-1.5 w-full"
                    disabled={moderateMutation.isPending}
                    onClick={() => moderateMutation.mutate({ status: "approved" })}
                  >
                    {moderateMutation.isPending && moderateMutation.variables?.status === "approved" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Одобрить
                  </Button>
                </PermissionGate>
                <PermissionGate permission="moderation.reject">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5 w-full"
                    disabled={moderateMutation.isPending}
                    onClick={() => moderateMutation.mutate({ status: "needs_review" })}
                  >
                    {moderateMutation.isPending && moderateMutation.variables?.status === "needs_review" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Отклонить
                  </Button>
                </PermissionGate>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
