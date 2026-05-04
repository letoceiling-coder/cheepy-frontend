import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crmCommerceApi, type CrmStoreOrderRow } from "@/lib/api";
import { Search, Download } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export default function CrmOrdersPage() {
  const navigate = useNavigate();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ["crm", "store-orders", { page, status: statusFilter, payment_status: paymentFilter, search }],
    queryFn: () =>
      crmCommerceApi.storeOrders({
        page,
        per_page: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
        payment_status: paymentFilter === "all" ? undefined : paymentFilter,
        search: search.trim() || undefined,
      }),
    staleTime: 30_000,
  });

  const rows = q.data?.data ?? [];
  const meta = q.data?.meta;
  const err = q.error as Error | undefined;

  const columns: Column<CrmStoreOrderRow>[] = [
    { key: "number", title: "Номер", render: (o) => <span className="font-medium text-sm">{o.number}</span> },
    {
      key: "user_email",
      title: "Клиент",
      render: (o) => <span>{[o.user_name, o.user_email].filter(Boolean).join(" · ") || "—"}</span>,
    },
    { key: "seller_label", title: "Продавец", className: "hidden lg:table-cell text-sm text-muted-foreground" },
    { key: "total_amount", title: "Сумма", render: (o) => `${fmt(o.total_amount)} ₽` },
    { key: "status", title: "Статус", render: (o) => <StatusBadge status={o.status} /> },
    {
      key: "payment_status",
      title: "Оплата",
      render: (o) => <StatusBadge status={o.payment_status} />,
      className: "hidden md:table-cell",
    },
    { key: "delivery_label", title: "Доставка", className: "hidden lg:table-cell text-xs max-w-[200px] truncate" },
    {
      key: "created_at",
      title: "Дата",
      render: (o) =>
        o.created_at ? new Date(o.created_at).toLocaleString("ru-RU") : <span className="text-muted-foreground">—</span>,
    },
  ];

  const exportCsv = () => {
    const lines = ["id,number,user_email,status,payment_status,total_amount,created_at"];
    for (const o of rows) {
      lines.push(
        `${o.id},${CSV(o.number)},${CSV(o.user_email ?? "")},${CSV(o.status)},${CSV(o.payment_status)},${o.total_amount},${CSV(o.created_at ?? "")}`
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `store-orders-page-${meta?.current_page ?? 1}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Заказы витрины"
        description={
          q.isFetching
            ? "Загрузка…"
            : `Таблица customer_orders · всего записей по фильтрам: ${meta?.total ?? rows.length}`
        }
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" type="button" onClick={() => exportCsv()} disabled={!rows.length}>
            <Download className="h-3.5 w-3.5" /> Экспорт страницы
          </Button>
        }
      />

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
        <Button
          variant="secondary"
          size="sm"
          className="h-8"
          onClick={() => {
            setPage(1);
            setSearch(draftSearch.trim());
          }}
        >
          Найти
        </Button>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setPage(1);
            setStatusFilter(v);
          }}
        >
          <SelectTrigger className="h-8 max-w-[210px] text-sm">
            <SelectValue placeholder="Статус заказа" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы заказа</SelectItem>
            <SelectItem value="awaiting_payment">awaiting_payment</SelectItem>
            <SelectItem value="confirmed">confirmed</SelectItem>
            <SelectItem value="new">new</SelectItem>
            <SelectItem value="cancelled">cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={paymentFilter}
          onValueChange={(v) => {
            setPage(1);
            setPaymentFilter(v);
          }}
        >
          <SelectTrigger className="h-8 max-w-[180px] text-sm">
            <SelectValue placeholder="Оплата" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все оплаты</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="paid">paid</SelectItem>
            <SelectItem value="failed">failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка заказов…</p>
      ) : err ? (
        <p className="text-sm text-destructive">{err.message}</p>
      ) : (
        <>
          <DataTable data={rows} columns={columns} onRowClick={(o) => navigate(`/crm/orders/${o.id}`)} />
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
    </div>
  );
}

function CSV(v: string) {
  if (v.includes(",") || v.includes('"')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
