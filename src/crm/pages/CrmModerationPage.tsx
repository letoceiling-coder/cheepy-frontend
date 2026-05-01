import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { CrmSellerMultiSelect } from "../components/CrmSellerMultiSelect";
import { CrmCategoryMultiSelect } from "../components/CrmCategoryMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminSystemProductsApi,
  adminCatalogApi,
  sellersApi,
  type SystemProductItem,
} from "@/lib/api";
import { Search, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const QK = ["admin-system-products-moderation"];

const QK_CATEGORY_TREE_STATS = ["catalog-categories-crm-tree-stats"] as const;

function donorSourceLabel(item: SystemProductItem): string {
  const donorSrcs = item.donor_sources ?? [];
  if (donorSrcs.length > 0) {
    const d = donorSrcs[0]?.donor;
    if (d?.title) return d.title.slice(0, 50) + (d.title.length > 50 ? "…" : "");
    if (d?.external_id) return d.external_id;
    return `#${donorSrcs[0]?.donor_product_id ?? "?"}`;
  }
  const srcs = item.product_sources ?? item.productSources ?? [];
  if (srcs.length === 0) return "—";
  const first = srcs[0];
  const p = first?.product;
  if (p?.title) return p.title.slice(0, 50) + (p.title.length > 50 ? "…" : "");
  if (p?.external_id) return p.external_id;
  return `#${first?.product_id ?? "?"}`;
}

function formatDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return s;
  }
}

const PER_PAGE = 25;

export default function CrmModerationPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "needs_review">("pending");
  const [categoryIdsFilter, setCategoryIdsFilter] = useState<number[]>([]);
  const [sellerIdsFilter, setSellerIdsFilter] = useState<number[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryIdsFilter, sellerIdsFilter, debouncedSearch]);

  const sellerIdsFilterKey = useMemo(() => [...sellerIdsFilter].sort((a, b) => a - b).join("|"), [sellerIdsFilter]);
  const categoryIdsFilterKey = useMemo(
    () => [...categoryIdsFilter].sort((a, b) => a - b).join("|"),
    [categoryIdsFilter],
  );

  const { data: categoryTreeRes } = useQuery({
    queryKey: QK_CATEGORY_TREE_STATS,
    queryFn: async () => adminCatalogApi.catalogCategoriesTreeProductStats(),
  });
  const categoryTreeRoots = categoryTreeRes?.data ?? [];

  const { data: sellersRes } = useQuery({
    queryKey: ["crm-sellers-dd", "moderation"],
    queryFn: async () => ({ data: await sellersApi.listAll() }),
  });

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: [QK[0], statusFilter, debouncedSearch, categoryIdsFilterKey, sellerIdsFilterKey, page],
    queryFn: () =>
      adminSystemProductsApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        category_ids: categoryIdsFilter.length > 0 ? categoryIdsFilter : undefined,
        seller_ids: sellerIdsFilter.length > 0 ? sellerIdsFilter : undefined,
        page,
        per_page: PER_PAGE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "needs_review" }) =>
      adminSystemProductsApi.moderate(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      queryClient.invalidateQueries({ queryKey: [...QK_CATEGORY_TREE_STATS] });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Ошибка обновления");
    },
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? 0;
  const listDescription =
    statusFilter === "pending"
      ? `${total} в очереди модерации`
      : `${total} по выбранным фильтрам`;

  const columns: Column<SystemProductItem>[] = [
    { key: "id", title: "ID", className: "w-20", render: (m) => <span className="font-mono text-xs">{m.id}</span> },
    { key: "name", title: "Название", render: (m) => <span className="font-medium text-sm">{m.name}</span> },
    { key: "category", title: "Категория", className: "hidden lg:table-cell", render: (m) => m.category?.name ?? "—" },
    {
      key: "list_position",
      title: "Поз.",
      className: "w-12 text-right hidden md:table-cell",
      render: (m) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{m.list_position ?? 0}</span>
      ),
    },
    { key: "donor", title: "Донор-источник", className: "hidden md:table-cell max-w-[200px] truncate", render: donorSourceLabel },
    { key: "created_at", title: "Создан", render: (m) => formatDate(m.created_at) },
    { key: "status", title: "Статус", render: (m) => <StatusBadge status={m.status} /> },
    {
      key: "actions",
      title: "Действия",
      className: "w-36",
      render: (m) => {
        if (m.status !== "pending") return null;
        const loading = patchMutation.isPending && patchMutation.variables?.id === m.id;
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                patchMutation.mutate({ id: m.id, status: "approved" });
              }}
            >
              {loading && patchMutation.variables?.status === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Одобрить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-destructive hover:bg-destructive/10"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                patchMutation.mutate({ id: m.id, status: "needs_review" });
              }}
            >
              {loading && patchMutation.variables?.status === "needs_review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Отклонить
            </Button>
          </div>
        );
      },
    },
  ];

  if (!data && isPending) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Модерация" description="Загрузка..." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Модерация" description="Ошибка загрузки" />
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Не удалось загрузить данные"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Модерация" description={listDescription} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-8 w-40 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pending">Ожидают</option>
          <option value="all">Все статусы</option>
          <option value="approved">Одобрены</option>
          <option value="needs_review">Отклонены</option>
        </select>
        <CrmCategoryMultiSelect roots={categoryTreeRoots} value={categoryIdsFilter} onChange={setCategoryIdsFilter} />
        <CrmSellerMultiSelect
          sellers={sellersRes?.data ?? []}
          value={sellerIdsFilter}
          onChange={setSellerIdsFilter}
        />
      </div>

      {isFetching && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5" aria-live="polite">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          Обновление списка…
        </p>
      )}

      <DataTable data={items} columns={columns} onRowClick={(m) => navigate(`/crm/moderation/${m.id}`)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Страница {meta?.current_page ?? 1} из {lastPage} · на странице {items.length} · всего {total}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Следующая страница"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
