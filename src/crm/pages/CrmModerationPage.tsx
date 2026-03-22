import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminSystemProductsApi, type SystemProductItem } from "@/lib/api";
import { Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const QK = ["admin-system-products-moderation"];

function donorSourceLabel(item: SystemProductItem): string {
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

export default function CrmModerationPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "needs_review">("pending");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [QK[0], statusFilter === "all" ? undefined : statusFilter, search],
    queryFn: () =>
      adminSystemProductsApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        per_page: 100,
      }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "needs_review" }) =>
      adminSystemProductsApi.patch(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Ошибка обновления");
    },
  });

  const items = data?.data ?? [];
  const pendingCount = statusFilter === "pending" ? (data?.meta?.total ?? 0) : items.filter((i) => i.status === "pending").length;

  const columns: Column<SystemProductItem>[] = [
    { key: "id", title: "ID", className: "w-20", render: (m) => <span className="font-mono text-xs">{m.id}</span> },
    { key: "name", title: "Название", render: (m) => <span className="font-medium text-sm">{m.name}</span> },
    { key: "category", title: "Категория", className: "hidden lg:table-cell", render: (m) => m.category?.name ?? "—" },
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
      <PageHeader title="Модерация" description={`${pendingCount} товаров ожидают проверки`} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию..." className="pl-8 h-8 text-sm" />
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
      </div>

      <DataTable data={items} columns={columns} onRowClick={(m) => navigate(`/crm/moderation/${m.id}`)} />
      <p className="text-xs text-muted-foreground">Показано {items.length} из {data?.meta?.total ?? 0}</p>
    </div>
  );
}
