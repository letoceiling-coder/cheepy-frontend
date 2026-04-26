import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  adminSystemProductsApi,
  adminCatalogApi,
  sellersApi,
  resolveCrmMediaAssetUrl,
  type SystemProductItem,
  type SystemProductStatus,
  type CatalogCategoryItem,
} from "@/lib/api";
import { Plus, Search, Download, Loader2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const QK = ["admin-system-products"];

const STATUS_FILTER_STORAGE_KEY = "crm.products.statusFilter";
const VALID_STATUS_FILTERS = new Set(["all", "published", "approved", "draft", "pending", "needs_review"]);

function readStoredStatusFilter(): string {
  if (typeof window === "undefined") return "published";
  try {
    const v = localStorage.getItem(STATUS_FILTER_STORAGE_KEY);
    if (v && VALID_STATUS_FILTERS.has(v)) return v;
  } catch {
    /* ignore quota / private mode */
  }
  return "published";
}

function persistStatusFilter(value: string): void {
  try {
    if (VALID_STATUS_FILTERS.has(value)) {
      localStorage.setItem(STATUS_FILTER_STORAGE_KEY, value);
    }
  } catch {
    /* ignore */
  }
}

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

/** Относительные пути и /storage — с origin API; http→https на HTTPS-странице. */
function thumbnailSrc(raw: string | null | undefined): string {
  const u = String(raw || "").trim();
  if (!u) return "";
  const resolved = /^https?:\/\//i.test(u) ? u : resolveCrmMediaAssetUrl(u);
  if (typeof window !== "undefined" && window.location.protocol === "https:" && resolved.startsWith("http://")) {
    return resolved.replace(/^http:\/\//i, "https://");
  }
  return resolved;
}

const QUICK_STATUSES: { value: SystemProductStatus; label: string }[] = [
  { value: "published", label: "Опубликован" },
  { value: "approved", label: "Одобрен" },
  { value: "pending", label: "На модерации" },
  { value: "needs_review", label: "На проверке" },
  { value: "draft", label: "Черновик" },
];

async function fetchAllCatalogCategoriesForProducts(): Promise<CatalogCategoryItem[]> {
  const first = await adminCatalogApi.catalogCategoriesList({ per_page: 100, page: 1 });
  const total = first.meta?.total ?? first.data.length;
  const perPage = first.meta?.per_page ?? 100;
  if (total <= perPage) return first.data;

  const pages = Math.ceil(total / perPage);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      adminCatalogApi.catalogCategoriesList({ per_page: perPage, page: i + 2 })
    )
  );

  return [...first.data, ...rest.flatMap((r) => r.data)];
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

const PER_PAGE = 50;

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

export default function CrmProductsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(readStoredStatusFilter);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, sellerFilter, debouncedSearch]);

  const { data: categoriesRes } = useQuery({
    queryKey: ["catalog-categories-flat", "products-list"],
    queryFn: fetchAllCatalogCategoriesForProducts,
  });
  const categoryOptions = useMemo(
    () => buildCategoryTreeOptions(categoriesRes?.data ?? []),
    [categoriesRes?.data]
  );

  const { data: sellersRes } = useQuery({
    queryKey: ["crm-sellers-dd", "products"],
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

  const items = data?.data ?? [];
  const meta = data?.meta;
  const lastPage = meta?.last_page ?? 1;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SystemProductStatus }) =>
      adminSystemProductsApi.moderate(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => toast.error(e.message || "Не удалось сменить статус"),
  });

  const columns: Column<SystemProductItem>[] = [
    {
      key: "image",
      title: "Фото",
      className: "w-14",
      render: (p) => <ThumbCell url={p.thumbnail_url} />,
    },
    { key: "name", title: "Название", render: (p) => <span className="font-medium text-sm">{p.name}</span> },
    { key: "category", title: "Категория", className: "hidden lg:table-cell", render: (p) => p.category?.name ?? "—" },
    {
      key: "list_position",
      title: "Поз.",
      className: "w-14 text-right hidden sm:table-cell",
      render: (p) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{p.list_position ?? 0}</span>
      ),
    },
    {
      key: "price",
      title: "Цена",
      render: (p) => {
        if (p.price) return p.price;
        if (p.price_raw != null) return `${fmt(p.price_raw)} ₽`;
        return "—";
      },
    },
    {
      key: "stock",
      title: "Остаток",
      className: "hidden md:table-cell",
      render: () => "—",
    },
    {
      key: "status",
      title: "Статус",
      className: "min-w-[200px]",
      render: (p) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={p.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-0.5 px-2"
                disabled={statusMutation.isPending}
                aria-label="Изменить статус"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {QUICK_STATUSES.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={p.status === opt.value || statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: p.id, status: opt.value })}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Товары" description="Загрузка..." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Товары" description="Ошибка загрузки" />
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Не удалось загрузить данные"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Товары"
        description={`${data?.meta?.total ?? 0} в каталоге CRM · фильтр по статусу сохраняется в браузере`}
        actions={
          <Link to="/crm/products/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Добавить товар
            </Button>
          </Link>
        }
      />

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
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            persistStatusFilter(v);
          }}
        >
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="published">Опубликованы</SelectItem>
            <SelectItem value="approved">Одобрены</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
            <SelectItem value="pending">На модерации</SelectItem>
            <SelectItem value="needs_review">На проверке</SelectItem>
          </SelectContent>
        </Select>
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
        <Button variant="outline" size="sm" className="h-8 gap-1.5 ml-auto">
          <Download className="h-3.5 w-3.5" /> Экспорт
        </Button>
      </div>

      <DataTable data={items} columns={columns} onRowClick={(p) => navigate(`/crm/moderation/${p.id}`)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Страница {meta?.current_page ?? 1} из {lastPage} · на странице {items.length} · всего {data?.meta?.total ?? 0}
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
