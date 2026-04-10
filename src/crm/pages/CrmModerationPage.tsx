import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminSystemProductsApi,
  adminCatalogApi,
  sellersApi,
  type SystemProductItem,
  type CatalogCategoryItem,
} from "@/lib/api";
import { Search, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const QK = ["admin-system-products-moderation"];

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

function buildCategoryTreeOptions(cats: CatalogCategoryItem[]): { id: number; label: string }[] {
  const byParent = new Map<number | null, CatalogCategoryItem[]>();
  cats.forEach((c) => {
    const pid = c.parent_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  });
  const out: { id: number; label: string }[] = [];
  function walk(pid: number | null, depth: number) {
    const arr = byParent.get(pid) ?? [];
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const c of arr) {
      const pad = depth > 0 ? `${"—".repeat(depth)} ` : "";
      out.push({ id: c.id, label: `${pad}${c.name}` });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

const PER_PAGE = 25;

export default function CrmModerationPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "needs_review">("pending");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, sellerFilter, debouncedSearch]);

  const { data: categoriesRes } = useQuery({
    queryKey: ["catalog-categories-flat", "moderation-list"],
    queryFn: () => adminCatalogApi.catalogCategoriesList({ per_page: 500, page: 1 }),
  });
  const categoryOptions = useMemo(
    () => buildCategoryTreeOptions(categoriesRes?.data ?? []),
    [categoriesRes?.data]
  );

  const { data: sellersRes } = useQuery({
    queryKey: ["crm-sellers-dd", "moderation"],
    queryFn: () => sellersApi.list({ per_page: 500, page: 1 }),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [QK[0], statusFilter, debouncedSearch, categoryFilter, sellerFilter, page],
    queryFn: () =>
      adminSystemProductsApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
        seller_id: sellerFilter ? Number(sellerFilter) : undefined,
        page,
        per_page: PER_PAGE,
      }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "needs_review" }) =>
      adminSystemProductsApi.moderate(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
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

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Модерация" description="Загрузка..." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 min-w-[160px] max-w-[220px] rounded-md border border-input bg-background px-3 text-sm truncate"
          title="Категория витрины"
        >
          <option value="">Все категории</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={sellerFilter}
          onChange={(e) => setSellerFilter(e.target.value)}
          className="h-8 min-w-[160px] max-w-[220px] rounded-md border border-input bg-background px-3 text-sm truncate"
          title="Продавец"
        >
          <option value="">Все продавцы</option>
          {(sellersRes?.data ?? []).map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

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
