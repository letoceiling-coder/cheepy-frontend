import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ShoppingCart, Users, Store, TrendingUp, CreditCard, FolderTree, Download } from "lucide-react";
import { dashboardKpis, salesChartData, crmOrders, topProducts } from "../data/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

export default function CrmDashboardPage() {
  const [period, setPeriod] = useState("6m");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const kpi = dashboardKpis;

  const recentOrders = crmOrders.slice(0, 5);
  const orderCols: Column<typeof recentOrders[0]>[] = [
    { key: "number", title: "Номер" },
    { key: "userName", title: "Клиент" },
    { key: "total", title: "Сумма", render: o => `${fmt(o.total)} RUB` },
    { key: "status", title: "Статус", render: o => <StatusBadge status={o.status} /> },
    { key: "createdAt", title: "Дата" },
  ];

  const topCols: Column<typeof topProducts[0]>[] = [
    { key: "title", title: "Товар" },
    { key: "sold", title: "Продано" },
    { key: "revenue", title: "Выручка", render: p => `${fmt(p.revenue)} RUB` },
    { key: "rating", title: "Рейтинг" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Обзор ключевых метрик маркетплейса"
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
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Экспорт
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Оборот" value={`${fmt(kpi.totalRevenue)} RUB`} change={kpi.revenueGrowth} icon={DollarSign} />
        <StatCard title="Заказы" value={fmt(kpi.totalOrders)} change={kpi.ordersGrowth} icon={ShoppingCart} />
        <StatCard title="Пользователи" value={fmt(kpi.totalUsers)} change={kpi.usersGrowth} icon={Users} />
        <StatCard title="Продавцы" value={kpi.activeSellers} icon={Store} />
        <StatCard title="Конверсия" value={`${kpi.conversion}%`} icon={TrendingUp} />
        <StatCard title="Средний чек" value={`${fmt(kpi.avgCheck)} RUB`} icon={CreditCard} />
        <StatCard title="Топ категория" value={kpi.topCategory} icon={FolderTree} />
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
          <ResponsiveContainer width="100%" height={260}>
            {chartType === "line" ? (
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">Заказы по месяцам</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="orders" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-3">Последние заказы</h3>
          <DataTable data={recentOrders} columns={orderCols} />
        </div>
        <div>
          <h3 className="text-sm font-medium mb-3">Топ товары</h3>
          <DataTable data={topProducts} columns={topCols} />
        </div>
      </div>
    </div>
  );
}
