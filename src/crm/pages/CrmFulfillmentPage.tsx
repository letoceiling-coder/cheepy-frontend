import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crmCommerceApi, type CrmStoreOrderRow } from "@/lib/api";
import { Search, Package, Truck, CheckCircle, RotateCcw, Clock } from "lucide-react";

export default function CrmFulfillmentPage() {
  const navigate = useNavigate();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statsQ = useQuery({
    queryKey: ["crm", "store-orders", "stats"],
    queryFn: () => crmCommerceApi.storeOrderStats(),
    staleTime: 30_000,
  });

  const listQ = useQuery({
    queryKey: ["crm", "store-orders", "fulfillment", { page, status: statusFilter, search }],
    queryFn: () =>
      crmCommerceApi.storeOrders({
        page,
        per_page: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
    staleTime: 30_000,
  });

  const byOrder = statsQ.data?.data.by_order_status ?? {};
  const byPay = statsQ.data?.data.by_payment_status ?? {};

  const s = {
    pending: Number(byOrder.awaiting_payment ?? 0),
    confirmed: Number(byOrder.confirmed ?? 0),
    newCount: Number(byOrder.new ?? 0),
    paid: Number(byPay.paid ?? 0),
    payPending: Number(byPay.pending ?? 0),
  };

  const rows = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const err = listQ.error as Error | undefined;

  const columns: Column<CrmStoreOrderRow>[] = [
    { key: "id", title: "ID", className: "w-20", render: (o) => <span className="font-mono text-xs">{o.id}</span> },
    {
      key: "number",
      title: "Заказ",
      render: (o) => (
        <button type="button" className="font-mono text-xs text-primary hover:underline" onClick={() => navigate(`/crm/orders/${o.id}`)}>
          {o.number}
        </button>
      ),
    },
    {
      key: "user_email",
      title: "Клиент",
      render: (o) => [o.user_name, o.user_email].filter(Boolean).join(" · ") || "—",
    },
    {
      key: "items_placeholder",
      title: "Строк позиций",
      className: "hidden md:table-cell text-muted-foreground text-xs",
      render: () => "→ карточка заказа",
    },
    { key: "status", title: "Статус CRM", render: (o) => <StatusBadge status={o.status} /> },
    { key: "payment_status", title: "Оплата", render: (o) => <StatusBadge status={o.payment_status} /> },
    {
      key: "carrier",
      title: "Логистика",
      className: "hidden lg:table-cell text-xs",
      render: (o) => o.delivery_provider || o.delivery_label || "—",
    },
    {
      key: "updated_at",
      title: "Обновлено",
      className: "hidden xl:table-cell text-xs text-muted-foreground",
      render: (o) => (o.updated_at ? new Date(o.updated_at).toLocaleString("ru-RU") : "—"),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Fulfillment" description="Те же заказы customer_orders: вид для логистики и статусов" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Ожидают оплаты" value={s.pending} icon={Clock} />
        <StatCard title="Оплачено (CRM)" value={s.paid} icon={CheckCircle} />
        <StatCard title="Оплата pending" value={s.payPending} icon={Package} />
        <StatCard title="Подтверждённые" value={s.confirmed} icon={Package} />
        <StatCard title="Новые (new)" value={s.newCount} icon={Truck} />
        <StatCard title="Отменённые" value={Number(byOrder.cancelled ?? 0)} icon={RotateCcw} />
      </div>

      {statsQ.error ? (
        <p className="text-xs text-destructive">Статистика: {(statsQ.error as Error).message}</p>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setSearch(draftSearch.trim());
              }
            }}
            placeholder="Номер, email клиента…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="secondary" size="sm" className="h-8" onClick={() => { setPage(1); setSearch(draftSearch.trim()); }}>
          Найти
        </Button>
        <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue placeholder="Фильтр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="awaiting_payment">awaiting_payment</SelectItem>
            <SelectItem value="confirmed">confirmed</SelectItem>
            <SelectItem value="new">new</SelectItem>
            <SelectItem value="cancelled">cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : err ? (
        <p className="text-sm text-destructive">{err.message}</p>
      ) : (
        <>
          <DataTable data={rows} columns={columns} />
          {meta && meta.last_page > 1 ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Button variant="outline" size="sm" className="h-8" disabled={meta.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Назад
              </Button>
              <span>
                Страница {meta.current_page} из {meta.last_page}
              </span>
              <Button variant="outline" size="sm" className="h-8" disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Вперёд
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Показано {rows.length}</p>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Отдельного конвейера «сборка → трек номер» в БД пока нет: отображаются фактические поля заказа и снимок доставки (
        delivery_snapshot). Трек номер появится после добавления модели отправлений или расширения заказа.
      </p>
    </div>
  );
}
