import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminSystemProductsApi, type SystemProductItem } from "@/lib/api";
import { Plus, Search, Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const QK = ["admin-system-products"];

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export default function CrmProductsPage() {
  const [search, setSearch] = useState("");
  /** По умолчанию витринные позиции; модерация — отдельный раздел CRM */
  const [statusFilter, setStatusFilter] = useState("published");
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [QK[0], statusFilter === "all" ? undefined : statusFilter, search],
    queryFn: () =>
      adminSystemProductsApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        per_page: 50,
      }),
  });

  const items = data?.data ?? [];

  const columns: Column<SystemProductItem>[] = [
    {
      key: "image",
      title: "Фото",
      className: "w-14",
      render: () => <div className="h-10 w-10 rounded bg-muted" />,
    },
    { key: "name", title: "Название", render: (p) => <span className="font-medium text-sm">{p.name}</span> },
    { key: "category", title: "Категория", className: "hidden lg:table-cell", render: (p) => p.category?.name ?? "—" },
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
    { key: "status", title: "Статус", render: (p) => <StatusBadge status={p.status} /> },
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
        description={`${data?.meta?.total ?? 0} в каталоге CRM · по умолчанию показаны опубликованные`}
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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию..." className="pl-8 h-8 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        <Button variant="outline" size="sm" className="h-8 gap-1.5 ml-auto">
          <Download className="h-3.5 w-3.5" /> Экспорт
        </Button>
      </div>

      <DataTable data={items} columns={columns} onRowClick={(p) => navigate(`/crm/products/${p.id}`)} />
      <p className="text-xs text-muted-foreground">
        Показано {items.length} из {data?.meta?.total ?? 0}
      </p>
    </div>
  );
}
