import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Star, Loader2 } from "lucide-react";
import type { CrmCatalogSellerRow } from "@/lib/api";
import { crmStoreInsightsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

export default function CrmSellersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-catalog-sellers", page, appliedSearch],
    queryFn: () =>
      crmStoreInsightsApi.catalogSellers({
        page,
        per_page: 50,
        search: appliedSearch.trim() || undefined,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const dash = (v: number | null | undefined, suffix = "") =>
    v === null || v === undefined ? "—" : `${fmt(v)}${suffix}`;

  const columns: Column<CrmCatalogSellerRow>[] = [
    { key: "name", title: "Продавец", render: (s) => <span className="font-medium text-sm">{s.name}</span> },
    { key: "status", title: "Статус", render: (s) => <StatusBadge status={s.status} /> },
    { key: "rating", title: "Рейтинг", render: (s) => (
      <span className="flex items-center gap-1 text-sm">
        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
        {typeof s.rating === "number" ? s.rating.toFixed(2) : "—"}
      </span>
    ) },
    { key: "products", title: "Товары" },
    { key: "orders", title: "Заказы", render: (s) => dash(s.orders ?? null) },
    { key: "revenue_rub", title: "Выручка", render: (s) => dash(s.revenue_rub ?? null, " ₽"), className: "hidden md:table-cell" },
    { key: "commission", title: "Комиссия", render: (s) => dash(s.commission ?? null, "%"), className: "hidden lg:table-cell" },
    { key: "complaints", title: "Жалобы", render: (s) => (s.complaints != null ? s.complaints : "—") },
  ];

  const applySearch = () => setAppliedSearch(search);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Продавцы"
        description={isLoading ? "Загрузка…" : `Каталог источников (${total}): привязка к реальным транзакциям по продавцам в API пока не выделена — выручка/заказы «—».`}
        actions={<Button variant="outline" size="sm" className="gap-1.5" disabled><Download className="h-3.5 w-3.5" /> Экспорт</Button>}
      />

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить продавцов.
        </div>
      ) : null}

      <div className="relative max-w-sm flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Поиск по названию или slug…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" className="h-8 shrink-0" onClick={applySearch}>
          Найти
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground text-sm items-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Загрузка…
        </div>
      ) : (
        <DataTable data={rows} columns={columns} onRowClick={(s) => navigate(`/crm/sellers/${s.id}`)} />
      )}
    </div>
  );
}
