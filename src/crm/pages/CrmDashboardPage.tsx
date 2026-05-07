import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ShoppingCart, Users, Store, TrendingUp, CreditCard, FolderTree, Download, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { crmStoreInsightsApi } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

function pctGrowth(curr: number, prev: number): number | undefined {
  if (prev <= 0) return undefined;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function fmtChartMoney(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `${v}`;
}

export default function CrmDashboardPage() {
  const [period, setPeriod] = useState("30d");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-store-overview", period],
    queryFn: () => crmStoreInsightsApi.overview(period),
  });

  const payload = data?.data;
  const kpis = payload?.kpis;
  const salesChartData = (payload?.sales_chart ?? []).map((r) => ({
    label: r.label,
    revenue: r.revenue_rub,
    orders: r.orders,
  }));

  type RecentRow = {
    number: string;
    userName: string;
    total: number;
    status: string;
    createdAt: string;
  };

  const recentOrders: RecentRow[] = (payload?.recent_orders ?? []).map((o) => ({
    number: o.number,
    userName: o.user_name || o.user_email || "—",
    total: o.total_amount,
    status: o.status,
    createdAt: o.created_at ? String(o.created_at).slice(0, 16).replace("T", " ") : "",
  }));

  type TopRow = { title: string; sold: number; revenue: number; rating: string };
  const topProducts: TopRow[] = (payload?.top_products ?? []).map((p) => ({
    title: p.title,
    sold: p.sold,
    revenue: p.revenue_rub,
    rating: "—",
  }));

  const revGrowth = kpis ? pctGrowth(kpis.revenue_rub, kpis.revenue_prev_rub) : undefined;
  const ordGrowth = kpis ? pctGrowth(kpis.orders_count, kpis.orders_prev) : undefined;

  const orderCols: Column<RecentRow>[] = [
    { key: "number", title: "Номер" },
    { key: "userName", title: "Клиент" },
    { key: "total", title: "Сумма", render: (o) => `${fmt(o.total)} ₽` },
    { key: "status", title: "Статус", render: (o) => <StatusBadge status={o.status} /> },
    { key: "createdAt", title: "Дата" },
  ];

  const topCols: Column<TopRow>[] = [
    { key: "title", title: "Товар" },
    { key: "sold", title: "Продано" },
    { key: "revenue", title: "Выручка", render: (p) => `${fmt(p.revenue)} ₽` },
    { key: "rating", title: "Рейтинг" },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Не удалось загрузить данные дашборда. Проверьте авторизацию и доступ к API.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Обзор ключевых метрик маркетплейса (оплаченные заказы за период)"
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
                <SelectItem value="6m">6 месяцев</SelectItem>
                <SelectItem value="1y">1 год</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" disabled>
              <Download className="h-3.5 w-3.5" /> Экспорт
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground gap-2 items-center text-sm">
          <Loader2 className="h-5 w-5 animate-spin" /> Загрузка…
        </div>
      )}

      {!isLoading && kpis && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Оборот (оплачено)" value={`${fmt(kpis.revenue_rub)} ₽`} change={revGrowth} icon={DollarSign} />
            <StatCard title="Заказы (оплачено)" value={fmt(kpis.orders_count)} change={ordGrowth} icon={ShoppingCart} />
            <StatCard title="Пользователи всего" value={fmt(kpis.users_registered)} icon={Users} />
            <StatCard title="Продавцы активные" value={fmt(kpis.sellers_active)} icon={Store} />
            <StatCard title="Новые пользователи" value={fmt(kpis.users_new_in_period)} icon={TrendingUp} />
            <StatCard title="Средний чек" value={`${fmt(kpis.avg_check_rub)} ₽`} icon={CreditCard} />
            <StatCard
              title="Топ категория"
              value={kpis.top_catalog_category ?? "—"}
              icon={FolderTree}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Динамика продаж</h3>
                <div className="flex gap-1">
                  <Button variant={chartType === "line" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setChartType("line")}>Линия</Button>
                  <Button variant={chartType === "bar" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setChartType("bar")}>Столбцы</Button>
                </div>
              </div>
              {salesChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Нет оплаченных заказов за период</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  {chartType === "line" ? (
                    <LineChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={fmtChartMoney} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={fmtChartMoney} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-4">Заказы по периодам</h3>
              {salesChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Нет данных</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="orders" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Последние оплаченные заказы</h3>
              <DataTable data={recentOrders} columns={orderCols} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Топ товары по выручке</h3>
              <DataTable data={topProducts} columns={topCols} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
